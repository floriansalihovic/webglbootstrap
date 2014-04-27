var bootstrapWebGL = (function bootstrapWebGL() {

  "use strict";

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
    shaderData.map(function mapShaderData(data, index, array) {
      var type = shaderTypes[data.type];
      if (type) {
        return compileShader(gl, type, data.source);
      }
      return null;
    }).filter(function filterShaders(shader, index, array) {
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

  /**
   * Access the WebGLRenderingContext from the canvas.
   *
   * @returns {WebGLRenderingContext}
   */
  function getContext(canvas) {
    console.info(getContext.name);

    try {
      // The WebGLRenderingContext is the object used to access the webgl api.
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

  /**
   * Sets up the WebGLRenderingContext for the applications scene.
   *
   * @param {WebGLRenderingContext} gl
   * @returns {WebGLRenderingContext}
   */
  function setContext(gl) {
    console.info(setContext.name);

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
       * @type {WebGLRenderingContext} */
      var gl = setContext(getContext(canvas));
      if (gl) {
        /**
         * @const
         * @type {WebGLProgram}
         */
        var shaderProgram = createProgram(gl, getShader(shaderIds));
        if (shaderProgram) {
          instructions.forEach(function (func) {
            console.log(func.name);

            func.apply(null) // the module passed
                .apply(null, [gl, shaderProgram]); // the 'run' function returned
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