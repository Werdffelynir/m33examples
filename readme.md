



# index
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    
    <title>M33 examples</title>
    <link rel="icon" type="image/x-icon" href="./favicon.ico">
    <script src="./reload.js"></script>

    <link rel="stylesheet" href="assets/cssme/cssme.css">
    <link rel="stylesheet" href="assets/cssme/themedark.css">
    <link rel="stylesheet" href="examples/main.css">

    <script type="importmap">
        {
            "imports": {
                "engine/": "/src/",
                "m33/": "/src/",
                "three": "/node_modules/three/src/Three.js",
                "three/": "/node_modules/three/",
                "three/addons": "/node_modules/three/examples/jsm/Addons.js",
                "three/addons/": "/node_modules/three/examples/jsm/",
                "three/fonts/": "/node_modules/three/examples/fonts/"
            }
        }
    </script>

</head>
<body>

<script type="module" src="/examples/main.js"> </script>
</body>
</html>

```

# dev create links 
```sh
#!/usr/bin/env bash
set -e



if [ -e "./node_modules/m33" ]; then
  rm -rf "./node_modules/m33"
fi

ln -s "./src" "./node_modules/m33"
```
