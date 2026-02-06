
let lastModified = null;

setInterval(() => {
    fetch('/watcher.php')
        .then(res => res.text())
        .then(time => {
            if (!lastModified) {
                lastModified = time;
            } else if (lastModified !== time) {
                console.log('[AutoReload] Change detected, reloading...');
                location.reload();
            }
        })
        .catch(err => console.error('[AutoReload] Error:', err));
}, 3000);
