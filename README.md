# Jumping into WebGL

Data visualizations were always my beloved since I am married to application development ... D3.js is so to say my adopted daughter ... with WebGL, I can finally escape the DOM. This post is heavily - almost copied - by the starter of [Mozilla's "Getting started with WebGL"](https://developer.mozilla.org/en-US/docs/Web/WebGL/Getting_started_with_WebGL) ... but I simply got frustrated because I am a too fast at yanking failing code into my editor. Also, there is no public repo and it might be a good excise to right it down in my own words and I might be able to avoid some global variables ...

Please have an up2date browser because we're going to write cutting edge code that relies on the world of [today](https://www.khronos.org/registry/webgl/specs/1.0/).

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

Working with WebGL requires some basic work, with which we start first - working our way towards the first white triangle. The components required are

- ```WebGLRenderingContext```
- ```WebGLProgram```
- ```WebGLShader```

For further information please consult the [specification](http://www.khronos.org/registry/webgl/specs/latest/1.0/).

Accessing the WebGLRenderingContext is crucial since it provides access to the WebGL api. This the first basic task to accomplish.

    /**
     * @param {Canvas} canvas
     * @returns {WebGLRenderingContext}
     */
    function getContext(canvas) {
      console.info(getContext.name);
  
      try {
        // The WebGLRenderingContext is the object used to access the webgl api.
        /** @type {WebGLRenderingContext} */
        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        // If the viewport dimensions are not set,
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
  
        return gl;
      } catch (error) {
        console.error(error);
      }
  
      return null;
    }

The function expects a ```Canvas``` element and tries to access the WebGLRenderingContext via ```webgl``` or ```experimental-webgl``` as a fallback. By the time of writing, i expect the fallback to be obsolete when running an up to date browser. Import is setting the viewport dimensions, when the context could be entered. Otherwise a black screen may be the result.

This gives us the entry point. WebGL requires a lot more configuration though. WebGL requires some levels of computation to transform data to pixels. This a very basic reference to the rendering pipeline. The rendering pipeline will get a discourse with a higher degree of detail on its own ...

## Shader

In short: Shader are used to produce pixels. A slightly longer descriptions would be. There are two kinds of shaders in WebGL: VertextShader and PixelShader. Shaders themselves a small programms by their own, which need to be loaded and compiled in order to get used. In most examples shaders are small scripts held in the dom with secific type attributes, an approach which we'll follow. The vertex shader, which is the first shader applied in the rendering pipeline:

    <script id="shader-vs" type="x-shader/x-vertex">
      attribute vec3 aVertexPosition;
      void main() {
        gl_Position = vec4(aVertexPosition, 1.0);
      }
    </script>

The vertex shader will be called on each vertice and calculate the native positions. The following fragment shader will calculate the pixel data which is needed to create the actual image rendered.

    <script id="shader-fs" type="x-shader/x-fragment">
      void main(void) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    </script>

I'm still not used to shaders but it is obvious that the value of ```gl_frageColor``` is white for every fragement of the screen. Those shaders need to be loaded/transformed into useful data. I think a small function like the following should be sufficient for our needs.

    /**
     * @param {Array} ids
     * @returns {Array} the compiled shaders
     */
    function getShader(ids) {
      console.info(getShader.name);
  
      var shaderTypes = [
        'x-shader/x-fragment',
        'x-shader/x-vertex'
      ];
  
      return ids.map(function (id) {
        var script = document.getElementById(id);
        if (script && (-1 < shaderTypes.indexOf(script.type))) {
          var child = script.firstChild;
  
          if (child.nodeType == child.TEXT_NODE) {
            return {
              id: id,
              type: script.type,
              source: child.textContent
            };
          }
        }
        return null;
      }).filter(function (shaderData) {
        return shaderData && shaderData.type;
      });
    }

The function is - hopefully - quite self explanatory. Passing an array of node ids will return an array of object containing three properties. The id is basically the identifier used for debugging purposes, the type will be actually used later to identify the shader as vertex or fragement shader and the source will be compiled.

Compiling the shader will be done in an extra function - mainly because we could attempt to compile any string, not just text node from the dom. The function displays the importance of the WebGLRenderingContext by providing a shader instance and compiling it.

    /**
     * @param {WebGLRenderingContext} gl
     * @param {number} type The type of the shader.
     *        The value must be either WebGLRenderingContext.VERTEX_SHADER
     *        or WebGLRenderingContext.FRAGMENT_SHADER.
     * @param {string} source The source string of the shader. This will be
     *        compiled.
     * @return {WebGLShader}
     */
    function compileShader(gl, type, source) {
      console.info(compileShader.name, type);
  
      /**
       * @const
       * @type {WebGLShader}
       */
      var shader = gl.createShader(type);
  
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
  
      if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
      } else {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
      }
  
      return null;
    }

The function expects three arguments. The WebGLRenderingContext, a type which needs be the value of ```WebGLRenderingContext.VERTEX_SHADER``` or ```WebGLRenderingContext.FRAGMENT_SHADER```. The source is the actual source code of the shader (a plain old string). The use the shader, these have to be applied to a ```
WebGLProgram``` as displayed by the following function.

    /**
     * @param {WebGLRenderingContext} gl
     * @param {Array} shaderData
     * @returns {WebGLProgram}
     */
    function createProgram(gl, shaderData) {
      console.info(createProgram.name);
  
      // When shaderData contains no data, exit - otherwise runtime errors will occur.
      if (!shaderData.length) {
        return null;
      }
  
      /**
       * The shader types expected.
       * @const
       * @enum {number}
       */
      var shaderTypes = {
        "x-shader/x-fragment": gl.FRAGMENT_SHADER,
        "x-shader/x-vertex": gl.VERTEX_SHADER
      };
  
      /**
       * The program object.
       * @const
       * @type {WebGLProgram}
       */
      var shaderProgram = gl.createProgram();
  
      // Compile the shader data into WebGLShader and attach it to the shaderProgram.
      shaderData.map(function (data, index, array) {
        var type = shaderTypes[data.type];
        if (type) {
          return compileShader(gl, type, data.source);
        }
        return null;
      }).filter(function (shader, index, array) {
        return null != shader;
      }).forEach(function (shader, index, array) {
        gl.attachShader(shaderProgram, shader);
      });
  
      gl.linkProgram(shaderProgram);
  
      // If creating the shader program failed, alert
      if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        gl.useProgram(shaderProgram);
        /** @const */
        var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(vertexPositionAttribute);
      } else {
        console.error('Unable to initialize the shader program.');
      }
  
      return shaderProgram;
    }

The function takes two arguments. The WebGLRenderingContext and the set of shaders we loaded. The programm (```WebGLProgramm```) is created by the context and the shaders, which get compiled from the sources are attached. After the programm was linked and the status returns ```true```, the program is used.

```todo``` what does

    var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

The ```WebGLRenderingcContext``` will be configured with a small function.

    /**
     * @param {WebGLRenderingContext} gl
     * @returns {WebGLRenderingContext}
     */
    function setContext(gl) {
      console.info(setContext.name);
  
      // Setting the color when the color buffer is cleared.
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      // Clearing the color buffer.
      gl.clear(gl.COLOR_BUFFER_BIT);
      // If the viewport dimensions are not set, nothing will be displayed.
      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
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


The code is one of the more simple pieces of WebGL code - pretty self explanatory I guess. We now have everything in place for our own small WebGL bootstrap module.

    var bootstrapWebGL = (function bootstrapWebGL() {
    
      "use strict";
    
      function getShader(ids) { /* {...} */ }
    
      function compileShader(gl, type, source) { /* {...} */ }
    
      function createProgram(gl, shaderData) { /* {...} */ }
    
      function getContext(canvas) { /* {...} */ }
    
      function setContext(gl) { /* {...} */ }
    
      /**
       * @type {function}
       * @param {string} canvasId
       * @param {Array} shaderIds
       * @param {Array} instructions
       */
      return function bootstrap(canvasId, shaderIds, instructions) {
        console.info(bootstrap.name);
    
        /**
         * @const
         * @type {Canvas}
         */
        var canvas = document.getElementById(canvasId);
        if (canvas) {
          /**
           * @const
           * @type {WebGLRenderingContext}
           */
          var gl = setContext(getContext(canvas));
          if (gl) {
            /**
             * @const
             * @type {WebGLProgram}
             */
            var shaderProgram = createProgram(gl, getShader(shaderIds));
            if (shaderProgram && instructions) {
              instructions.forEach(function (func) {
                func.apply(null) // the module passed
                    .apply(null, [gl, shaderProgram, canvas]); // the 'run' function returned
              });
            } else {
              console.error('An error occurred when creating the WebGLProgram.');
            }
          }
        } else {
          console.error('Could not resolve canvas with id %s.', canvasId);
        }
      };
    }());

The module is used to simplify the life of the ambitioned WebGL practioner. The ```canvasId``` and ```shaderIds``` hold references to ... nodes via ids. The ```instructions``` are contains modules which are - ultimately our application. The modules will get the necessary data by the boostrap module.

The ```boostrap``` module will now be used in the ```index.html``` accordingly to set up the stage for the common "Hello world." application of WebGL.

    <!DOCTYPE html>
    <html>
    <head>
      <title>Title of the document</title>
      <script src="bootstrap.js"></script>
      <script id="shader-fs" type="x-shader/x-fragment">
        void main(void) {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
      </script>
      <script id="shader-vs" type="x-shader/x-vertex">
        attribute vec3 aVertexPosition;
        void main() {
          gl_Position = vec4(aVertexPosition, 1.0);
        }
      </script>
      <script type="application/javascript">
        var instructions = [];
      </script>
    </head>
    <body onload="bootstrapWebGL('canvas', ['shader-fs', 'shader-vs'], instructions)">
    <canvas id="canvas" width="640" height="480"></canvas>
    </body>
    </html>

Our modified html page now uses our ```bootstrap``` module and everything which now missing is our application.

## The first application

The first application is basically a proof of concept, that everything is properly set up.

    function example1() {

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
    }

By placing the function in the ```instructions``` array of our script example1, a white triangle will be displayed.

## Colors - a science of its own.

WebGL is a complete shader based language. That is great - since shaders provide a level of indirection towards the actual output of our programs. That being said, a shader is also needed to