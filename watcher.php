<?php
$directory = __DIR__ . '/src';
$lastModified = 0;

$files = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($directory)
);

foreach ($files as $file) {
    if ($file->isFile()) {
        $lastModified = max($lastModified, $file->getMTime());
    }
}

echo $lastModified;
