(() => {
  // Preserve links shared before the website had separate pages.
  const destinations = {about:'/about',values:'/about#values',programmes:'/programmes',life:'/life',campus:'/campus',team:'/team',gallery:'/gallery',contact:'/contact',visit:'/contact#visit','school-news':'/news'};
  if (location.pathname === '/' || location.pathname === '/index.html') {
    const target = destinations[location.hash.slice(1)];
    if (target) location.replace(target);
  }
})();
