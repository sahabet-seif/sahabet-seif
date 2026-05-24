self.addEventListener('install', (event) => {
    console.log('تم تثبيت التطبيق بنجاح');
});

self.addEventListener('fetch', (event) => {
    // الكود ده بيخلي التطبيق يستجيب للطلبات عشان يظهر كبرنامج
});