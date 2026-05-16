export const filterQuotes = (quotes, searchTerm, selectedCategory) => {
  if (!selectedCategory) return [];

  return quotes.filter(quote => {
    // الفلترة هنا بقت بتدور جوه نص العبارة بس
    const matchesSearch = quote.text.includes(searchTerm);
    const matchesCategory = quote.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
};