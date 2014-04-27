# Jumping into WebGL

Data visualizations were always my beloved since I am married to application development ... D3.js is so to say my adopted daughter ... with WebGL, I can finally escape the DOM. This post is heavily - almost copied - by the starter of [Mozilla's "Getting started with WebGL"](https://developer.mozilla.org/en-US/docs/Web/WebGL/Getting_started_with_WebGL) ... but I simply got frustrated because I am a too fast at yanking failing code into my editor. Also, there is no public repo and it might be a good excise to right it down in my own words and I might be able to avoid some global variables ...

Please have an up2date browser because I write cutting edge code that relies on the world of tomorrow.

## Engage

When writing a WebGL application, we start with a basic HTML(5) template. We'll draw into a ```<canvas/>``` element, so, that should be present. The following piece of HTML can be copy/pasted into a new html file and will display nothing on the screen.

```
<!DOCTYPE html>
<html>
<head>
  <title>Data - Make it so ...</title>
</head>
<body>
<canvas id="canvas" width="640" height="480"></canvas>
</body>
</html>
```

The first task is to create a WebGL context, which allows us to enter the realm of 3d graphics. We'll do that by provding a callback to the body's ```onload``` event handler. When the handler is invoked, the canvas element is created and we can try to access the gl context.

```
<!DOCTYPE html>
<html>
<head>
  <title>Title of the document</title>
  <script type="application/javascript">
    var onLoad = (function () {
      /**
       * The WebGLRenderingContext used to access the webgl api
       * and make calls to the graphics card.
       * 
       * @type {WebGLRenderingContext}
       */
      var gl = null;

      /**
       * Access the WebGLRenderingContext from the canvas.
       *
       * @returns {WebGLRenderingContext}
       */
      function getWebGLRenderingContext() {
        var canvas = document.getElementById('canvas');
        try {
          // The WebGLRenderingContext is the object used to access the webgl api.
          return canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        } catch (error) {
          console.error(error);
        }
        return null;
      }

      return function () {
        gl = getWebGLRenderingContext();
      };
    }());
  </script>
</head>
<body onload="onLoad()">
<canvas id="canvas" width="640" height="480"></canvas>
</body>
</html>
```
Here we have the first bits to access the [WebGLRenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext). It is by convention usually named ```gl``` by convention (I rememeber it when I used JoGL a couple of years ago).

So, what did I do? In an anonymous function I declared a field which will be referenced asynchronously in the closure which is the actual return value of the callback we provide. The canvas element will be available in some time later after the function was invoked, so saving a little work for later is not optional, but required. The function ```getWebGLRenderingContext``` will access the context if available - if not ... we're screwed (please check the canvas' id, flood the code with logs to check if the methods are called and use your browsers debugging facilities to find to error ...).

When no error is thrown, the first steps to set up the scene can be done.

```
<!DOCTYPE html>
<html>
<head>
  <title>Title of the document</title>
  <script type="application/javascript">
    var onLoad = (function () {
      /**
       * The WebGLRenderingContext used to access the webgl api
       * and make calls to the graphics card.
       *
       * @type {WebGLRenderingContext}
       */
      var gl = null;

      /**
       * Access the WebGLRenderingContext from the canvas.
       *
       * @returns {WebGLRenderingContext}
       */
      function getWebGLRenderingContext() {
        var canvas = document.getElementById('canvas');
        try {
          // The WebGLRenderingContext is the object used to access the webgl api.
          return canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        } catch (error) {
          console.error(error);
        }
        return null;
      }

      /**
       * Sets up the WebGLRenderingContext for the applications scene.
       *
       * @param {WebGLRenderingContext} gl
       * @returns {WebGLRenderingContext}
       */
      function setUp(gl) {
        // Set clear color to black, fully opaque.
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Enable depth testing.
        gl.enable(gl.DEPTH_TEST);
        // Near things obscure far things.
        gl.depthFunc(gl.LEQUAL);
        // Clear the color as well as the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        return gl;
      }

      return function () {
        gl = getWebGLRenderingContext();
        if (gl) {
          setUp(gl)
        }
      };
    }());
  </script>
</head>
<body onload="onLoad()">
<canvas id="canvas" width="640" height="480"></canvas>
</body>
</html>
```
When executing the code, a black rectangle shoud appear on the screen. That's basically the proof that we're really running modern hardware and WebGL is working. I just want to stress at the moment, that we're working within the anonymous function - there will be no global variables introduced and we'll keep access to variables as restricted as possible ...

## Shaders and programs ...

Shaders and programs are necessary for rendering. As the Khonos group states

> ### 5.14.9 Programs and Shaders
> Rendering with OpenGL ES 2.0 requires the use of shaders, written in OpenGL ES's shading language,  GLSL ES. Shaders will be loaded from a source string (shaderSource), compiled (compileShader) and attached to a program (attachShader) which must be linked (linkProgram) and then used (useProgram).

Starting by adding the shaders to the document's dom.

    <script id="shader-fs" type="x-shader/x-fragment">
      void main(void) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    </script>

And the code for the vertex shader.

    <script id="shader-vs" type="x-shader/x-vertex">
      attribute vec3 aVertexPosition;

      uniform mat4 uMVMatrix;
      uniform mat4 uPMatrix;

      void main(void) {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
      }
    </script>

The application module:

    var instructions = [function example1() {

      'use strict';

      /**
       * @param {WebGLRenderingContext} gl
       * @returns {WebGLBuffer}
       */
      function createBuffer(gl) {
        console.info(createBuffer.name);

        var vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        var triangleVertices = [
          0.0, 0.5, 0.0,
          -0.5, -0.5, 0.0,
          0.5, -0.5, 0.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
        vertexBuffer.itemSize = 3;
        vertexBuffer.numberOfItems = 3;

        return vertexBuffer;
      }

      /**
       * @param {WebGLRenderingContext} gl
       * @param {WebGLProgram} shaderProgram
       * @param {WebGLBuffer} vertexBuffer
       * @returns {WebGLRenderingContext}
       */
      function draw(gl, shaderProgram, vertexBuffer) {
        console.info(draw.name);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
        gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.numberOfItems);

        return gl;
      }

      /**
       * @param {WebGLRenderingContext} gl
       * @param {WebGLProgram} shaderProgram
       * @param {Canvas} canvas
       * @returns {WebGLRenderingContext}
       */
      return function (gl, shaderProgram, canvas) {
        /** @type {WebGLBuffer} */
        var vertexBuffer = createBuffer(gl);
        draw(gl, shaderProgram, vertexBuffer);

        return gl;
      };
    }];

