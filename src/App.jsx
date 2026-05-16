import { useState, useEffect } from 'react';
import { quotesData as defaultQuotes, categories } from './data';
import { filterQuotes } from './utils';
import './index.css';

import { db } from './firebase'; 
import { collection, onSnapshot, doc, setDoc, arrayUnion, increment } from 'firebase/firestore';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [likes, setLikes] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  
  const [shareCounts, setShareCounts] = useState({});
  const [userCopiedList, setUserCopiedList] = useState({}); 

  const [activeCommentQuote, setActiveCommentQuote] = useState(null);
  const [commentsData, setCommentsData] = useState({}); 
  const [isWritingComment, setIsWritingComment] = useState(false); 
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  // التعديل السحري: استدعاء التفاعلات بس من غير مسح العبارات الأصلية
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "phrases"), (snapshot) => {
      if (!snapshot.empty) {
        const dbComments = {};
        const dbShares = {};
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.comments) dbComments[doc.id] = data.comments;
          if (data.shareCount) dbShares[doc.id] = data.shareCount;
        });
        
        setCommentsData(dbComments);
        setShareCounts(dbShares);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // بنستخدم عباراتك الأصلية دايماً في الفلترة
  const filteredQuotes = filterQuotes(defaultQuotes, searchTerm, selectedCategory);

  const handleCategoryClick = (category) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  const toggleLike = (id) => {
    setLikes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (text, id) => {
    navigator.clipboard.writeText(text);
    
    if (!userCopiedList[id]) {
      setShareCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
      setUserCopiedList(prev => ({ ...prev, [id]: true })); 
      
      try {
        const quoteRef = doc(db, "phrases", String(id));
        await setDoc(quoteRef, { shareCount: increment(1) }, { merge: true });
      } catch (e) {
        console.error("Firebase Error:", e);
      }
    }

    setCopiedId(id); 
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const openComments = (quote) => {
    setActiveCommentQuote(quote);
    setIsWritingComment(false);
  };

  const closeComments = () => {
    setActiveCommentQuote(null);
    setIsWritingComment(false);
    setNewCommentName('');
    setNewCommentText('');
  };

  const submitComment = async () => {
    if (newCommentName.trim() === '' || newCommentText.trim() === '') {
      alert("يرجى كتابة الاسم والتعليق أولاً!");
      return;
    }

    const newComment = {
      name: newCommentName,
      text: newCommentText
    };

    setCommentsData(prev => ({
      ...prev,
      [activeCommentQuote.id]: [...(prev[activeCommentQuote.id] || []), newComment]
    }));

    try {
      const quoteRef = doc(db, "phrases", String(activeCommentQuote.id));
      await setDoc(quoteRef, { comments: arrayUnion(newComment) }, { merge: true });
    } catch (e) {
      console.error("Firebase Error:", e);
    }

    setNewCommentName('');
    setNewCommentText('');
    setIsWritingComment(false);
  };

  if (activeCommentQuote) {
    const currentComments = commentsData[activeCommentQuote.id] || [];
    
    return (
      <div className="container">
        <button className="back-btn" onClick={closeComments}>
          <i className="fa-solid fa-arrow-right"></i> عودة للعبارات
        </button>

        <div className="quote-card" style={{ marginBottom: '2rem' }}>
          <div className="quote-header">
             <span className="quote-category">{activeCommentQuote.category}</span>
          </div>
          <p className="quote-text">{activeCommentQuote.text}</p>
          {activeCommentQuote.author && (
            <span className="quote-author">- {activeCommentQuote.author}</span>
          )}
        </div>

        <div className="comments-section">
          <h3 className="comments-title">التعليقات ({currentComments.length})</h3>
          
          {currentComments.length === 0 ? (
            <p className="no-results" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>كن أول من يضيف تعليقاً ✨</p>
          ) : (
            currentComments.map((comment, index) => (
              <div key={index} className="comment-item">
                <span className="comment-author">{comment.name}</span>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))
          )}

          <div className="add-comment-wrapper">
            {!isWritingComment ? (
              <button className="open-comment-btn" onClick={() => setIsWritingComment(true)}>
                <i className="fa-regular fa-comment"></i> أضف تعليقاً
              </button>
            ) : (
              <div className="comment-form">
                <input 
                  type="text" 
                  className="comment-input" 
                  placeholder="اسمك..." 
                  value={newCommentName}
                  onChange={(e) => setNewCommentName(e.target.value)}
                />
                <textarea 
                  className="comment-input" 
                  placeholder="اكتب تعليقك هنا..." 
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                ></textarea>
                <button className="submit-comment-btn" onClick={submitComment}>
                  نشر التعليق
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <div className="brand-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="45" height="45" fill="#c0c0c0">
            <path d="M0 336c0-79.5 64.5-144 144-144 16.7 0 32.7 2.9 47.5 8.1C218.1 118.2 300.6 64 392 64c110.5 0 200 89.5 200 200 0 16.4-2 32.4-5.8 47.8C617.4 330.4 640 361.6 640 400c0 61.9-50.1 112-112 112H128C57.3 512 0 454.7 0 384c0-23.4 6.3-45.3 17.3-64H0zm128 112h400c26.5 0 48-21.5 48-48s-21.5-48-48-48H106.3c-15.4 0-30.4 5.3-42.5 14.9C71.3 373.1 88.5 384 108.8 384c4.3 0 8.5-.4 12.6-1.1 16.7-2.9 33.3.4 46.4 9.1 13 8.7 21 23.3 21 38.6 0 9.4-4.8 17.8-12.4 22.8-5.7 3.8-12.6 6.1-19.8 6.1-4.7 0-9.2-.9-13.4-2.5 11 11.2 26.1 18.2 42.9 18.2z"/>
          </svg>
          <h1 className="title">سحابة صيف</h1>
        </div>
        <p className="subtitle">منصة الأدب والاقتباسات</p>
      </header>

      <div className="search-container">
        <input
          type="text"
          placeholder="ابحث في العبارات..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="categories-container">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="quotes-list">
        {!selectedCategory && (
          <p className="no-results">✨ اختر قسماً من الأعلى لعرض العبارات الخاصة به ✨</p>
        )}

        {selectedCategory && filteredQuotes.length === 0 && (
          <p className="no-results">لا توجد عبارات مطابقة في هذا القسم.</p>
        )}

        {filteredQuotes.map((quote) => {
          const currentCommentsCount = commentsData[quote.id] ? commentsData[quote.id].length : 0;
          
          return (
            <div key={quote.id} className="quote-card">
              <div className="quote-header">
                 <span className="quote-category">{quote.category}</span>
              </div>
              <p className="quote-text">{quote.text}</p>
              
              {quote.author && (
                <span className="quote-author">- {quote.author}</span>
              )}

              <div className="interaction-bar">
                <button 
                  className="action-btn" 
                  onClick={() => toggleLike(quote.id)}
                  style={{ color: likes[quote.id] ? '#c0c0c0' : '#f5f5f5' }}
                >
                  <i className={likes[quote.id] ? "fa-solid fa-heart action-icon" : "fa-regular fa-heart action-icon"}></i> 
                  {likes[quote.id] ? '1' : 'إعجاب'}
                </button>
                
                <button className="action-btn" onClick={() => openComments(quote)}>
                  <i className="fa-regular fa-comment action-icon"></i> 
                  {currentCommentsCount > 0 ? currentCommentsCount : 'تعليق'}
                </button>
                
                <button 
                  className="action-btn" 
                  onClick={() => copyToClipboard(quote.text, quote.id)}
                  style={{ color: copiedId === quote.id ? '#25D366' : '' }}
                >
                  <i className={copiedId === quote.id ? "fa-solid fa-check action-icon" : "fa-regular fa-copy action-icon"}></i> 
                  {copiedId === quote.id ? 'تم النسخ' : (shareCounts[quote.id] ? shareCounts[quote.id] : 'نسخ')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <a 
        href="https://whatsapp.com/channel/0029Vb5UpD3J3juwwrUNj70n" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="whatsapp-float"
        title="تابعنا على قناة الواتساب"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="35" height="35" fill="currentColor">
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
      </a>
    </div>
  );
}

export default App;