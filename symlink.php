<?php
// PHP Script to create a symlink from _next to .next
$target = '.next';
$link = '_next';

if (file_exists($link)) {
    if (is_link($link)) {
        echo "_next Link already exists. Skipping.<br>";
    } else {
        echo "_next Folder exists but is not a link. You should delete it first.<br>";
    }
} else {
    if (symlink($target, $link)) {
        echo "Successfully created _next symlink pointing to .next<br>";
    } else {
        echo "Failed to create symlink. Your hosting might not allow symlinks.<br>";
    }
}

// Also check for public as we might need a symlink for it too if it's inside standalone
// But we copied public to root so it should be fine.

echo "<br>Checking directories:<br>";
echo ".next exists: " . (file_exists('.next') ? 'Yes' : 'No') . "<br>";
echo "_next exists: " . (file_exists('_next') ? 'Yes' : 'No') . "<br>";
?>
