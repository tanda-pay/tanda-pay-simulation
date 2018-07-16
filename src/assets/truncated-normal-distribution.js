// This javascript is used to create a globally-scoped function (named pdf) that calculates the probability-density-function of a truncated normal distribution.
// It was made by using browserify to pack the dependencies of https://github.com/distributions-io/truncated-normal-pdf together
// It would be best to use npm to handle this dependency, but Stackblitz.com was bugged and wouldn't cooperate.

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    'use strict'

    exports.byteLength = byteLength
    exports.toByteArray = toByteArray
    exports.fromByteArray = fromByteArray

    var lookup = []
    var revLookup = []
    var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i]
      revLookup[code.charCodeAt(i)] = i
    }

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
    revLookup['-'.charCodeAt(0)] = 62
    revLookup['_'.charCodeAt(0)] = 63

    function getLens (b64) {
      var len = b64.length

      if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4')
      }

      // Trim off extra bytes after placeholder bytes are found
      // See: https://github.com/beatgammit/base64-js/issues/42
      var validLen = b64.indexOf('=')
      if (validLen === -1) validLen = len

      var placeHoldersLen = validLen === len
        ? 0
        : 4 - (validLen % 4)

      return [validLen, placeHoldersLen]
    }

// base64 is 4/3 + up to two characters of the original data
    function byteLength (b64) {
      var lens = getLens(b64)
      var validLen = lens[0]
      var placeHoldersLen = lens[1]
      return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
    }

    function _byteLength (b64, validLen, placeHoldersLen) {
      return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
    }

    function toByteArray (b64) {
      var tmp
      var lens = getLens(b64)
      var validLen = lens[0]
      var placeHoldersLen = lens[1]

      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

      var curByte = 0

      // if there are placeholders, only get up to the last complete 4 chars
      var len = placeHoldersLen > 0
        ? validLen - 4
        : validLen

      for (var i = 0; i < len; i += 4) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 18) |
          (revLookup[b64.charCodeAt(i + 1)] << 12) |
          (revLookup[b64.charCodeAt(i + 2)] << 6) |
          revLookup[b64.charCodeAt(i + 3)]
        arr[curByte++] = (tmp >> 16) & 0xFF
        arr[curByte++] = (tmp >> 8) & 0xFF
        arr[curByte++] = tmp & 0xFF
      }

      if (placeHoldersLen === 2) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 2) |
          (revLookup[b64.charCodeAt(i + 1)] >> 4)
        arr[curByte++] = tmp & 0xFF
      }

      if (placeHoldersLen === 1) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 10) |
          (revLookup[b64.charCodeAt(i + 1)] << 4) |
          (revLookup[b64.charCodeAt(i + 2)] >> 2)
        arr[curByte++] = (tmp >> 8) & 0xFF
        arr[curByte++] = tmp & 0xFF
      }

      return arr
    }

    function tripletToBase64 (num) {
      return lookup[num >> 18 & 0x3F] +
        lookup[num >> 12 & 0x3F] +
        lookup[num >> 6 & 0x3F] +
        lookup[num & 0x3F]
    }

    function encodeChunk (uint8, start, end) {
      var tmp
      var output = []
      for (var i = start; i < end; i += 3) {
        tmp =
          ((uint8[i] << 16) & 0xFF0000) +
          ((uint8[i + 1] << 8) & 0xFF00) +
          (uint8[i + 2] & 0xFF)
        output.push(tripletToBase64(tmp))
      }
      return output.join('')
    }

    function fromByteArray (uint8) {
      var tmp
      var len = uint8.length
      var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
      var parts = []
      var maxChunkLength = 16383 // must be multiple of 3

      // go through the array every three bytes, we'll deal with trailing stuff later
      for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(encodeChunk(
          uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
        ))
      }

      // pad the end with zeros, but make sure to not forget the extra bytes
      if (extraBytes === 1) {
        tmp = uint8[len - 1]
        parts.push(
          lookup[tmp >> 2] +
          lookup[(tmp << 4) & 0x3F] +
          '=='
        )
      } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + uint8[len - 1]
        parts.push(
          lookup[tmp >> 10] +
          lookup[(tmp >> 4) & 0x3F] +
          lookup[(tmp << 2) & 0x3F] +
          '='
        )
      }

      return parts.join('')
    }

  },{}],2:[function(require,module,exports){
    /*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
    /* eslint-disable no-proto */

    'use strict'

    var base64 = require('base64-js')
    var ieee754 = require('ieee754')

    exports.Buffer = Buffer
    exports.SlowBuffer = SlowBuffer
    exports.INSPECT_MAX_BYTES = 50

    var K_MAX_LENGTH = 0x7fffffff
    exports.kMaxLength = K_MAX_LENGTH

    /**
     * If `Buffer.TYPED_ARRAY_SUPPORT`:
     *   === true    Use Uint8Array implementation (fastest)
     *   === false   Print warning and recommend using `buffer` v4.x which has an Object
     *               implementation (most compatible, even IE6)
     *
     * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
     * Opera 11.6+, iOS 4.2+.
     *
     * We report that the browser does not support typed arrays if the are not subclassable
     * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
     * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
     * for __proto__ and has a buggy typed array implementation.
     */
    Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

    if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
      typeof console.error === 'function') {
      console.error(
        'This browser lacks typed array (Uint8Array) support which is required by ' +
        '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
      )
    }

    function typedArraySupport () {
      // Can typed array instances can be augmented?
      try {
        var arr = new Uint8Array(1)
        arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
        return arr.foo() === 42
      } catch (e) {
        return false
      }
    }

    Object.defineProperty(Buffer.prototype, 'parent', {
      get: function () {
        if (!(this instanceof Buffer)) {
          return undefined
        }
        return this.buffer
      }
    })

    Object.defineProperty(Buffer.prototype, 'offset', {
      get: function () {
        if (!(this instanceof Buffer)) {
          return undefined
        }
        return this.byteOffset
      }
    })

    function createBuffer (length) {
      if (length > K_MAX_LENGTH) {
        throw new RangeError('Invalid typed array length')
      }
      // Return an augmented `Uint8Array` instance
      var buf = new Uint8Array(length)
      buf.__proto__ = Buffer.prototype
      return buf
    }

    /**
     * The Buffer constructor returns instances of `Uint8Array` that have their
     * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
     * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
     * and the `Uint8Array` methods. Square bracket notation works as expected -- it
     * returns a single octet.
     *
     * The `Uint8Array` prototype remains unmodified.
     */

    function Buffer (arg, encodingOrOffset, length) {
      // Common case.
      if (typeof arg === 'number') {
        if (typeof encodingOrOffset === 'string') {
          throw new Error(
            'If encoding is specified then the first argument must be a string'
          )
        }
        return allocUnsafe(arg)
      }
      return from(arg, encodingOrOffset, length)
    }

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
      Object.defineProperty(Buffer, Symbol.species, {
        value: null,
        configurable: true,
        enumerable: false,
        writable: false
      })
    }

    Buffer.poolSize = 8192 // not used by this implementation

    function from (value, encodingOrOffset, length) {
      if (typeof value === 'number') {
        throw new TypeError('"value" argument must not be a number')
      }

      if (isArrayBuffer(value) || (value && isArrayBuffer(value.buffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length)
      }

      if (typeof value === 'string') {
        return fromString(value, encodingOrOffset)
      }

      return fromObject(value)
    }

    /**
     * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
     * if value is a number.
     * Buffer.from(str[, encoding])
     * Buffer.from(array)
     * Buffer.from(buffer)
     * Buffer.from(arrayBuffer[, byteOffset[, length]])
     **/
    Buffer.from = function (value, encodingOrOffset, length) {
      return from(value, encodingOrOffset, length)
    }

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
    Buffer.prototype.__proto__ = Uint8Array.prototype
    Buffer.__proto__ = Uint8Array

    function assertSize (size) {
      if (typeof size !== 'number') {
        throw new TypeError('"size" argument must be of type number')
      } else if (size < 0) {
        throw new RangeError('"size" argument must not be negative')
      }
    }

    function alloc (size, fill, encoding) {
      assertSize(size)
      if (size <= 0) {
        return createBuffer(size)
      }
      if (fill !== undefined) {
        // Only pay attention to encoding if it's a string. This
        // prevents accidentally sending in a number that would
        // be interpretted as a start offset.
        return typeof encoding === 'string'
          ? createBuffer(size).fill(fill, encoding)
          : createBuffer(size).fill(fill)
      }
      return createBuffer(size)
    }

    /**
     * Creates a new filled Buffer instance.
     * alloc(size[, fill[, encoding]])
     **/
    Buffer.alloc = function (size, fill, encoding) {
      return alloc(size, fill, encoding)
    }

    function allocUnsafe (size) {
      assertSize(size)
      return createBuffer(size < 0 ? 0 : checked(size) | 0)
    }

    /**
     * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
     * */
    Buffer.allocUnsafe = function (size) {
      return allocUnsafe(size)
    }
    /**
     * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
     */
    Buffer.allocUnsafeSlow = function (size) {
      return allocUnsafe(size)
    }

    function fromString (string, encoding) {
      if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8'
      }

      if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding)
      }

      var length = byteLength(string, encoding) | 0
      var buf = createBuffer(length)

      var actual = buf.write(string, encoding)

      if (actual !== length) {
        // Writing a hex string, for example, that contains invalid characters will
        // cause everything after the first invalid character to be ignored. (e.g.
        // 'abxxcd' will be treated as 'ab')
        buf = buf.slice(0, actual)
      }

      return buf
    }

    function fromArrayLike (array) {
      var length = array.length < 0 ? 0 : checked(array.length) | 0
      var buf = createBuffer(length)
      for (var i = 0; i < length; i += 1) {
        buf[i] = array[i] & 255
      }
      return buf
    }

    function fromArrayBuffer (array, byteOffset, length) {
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds')
      }

      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds')
      }

      var buf
      if (byteOffset === undefined && length === undefined) {
        buf = new Uint8Array(array)
      } else if (length === undefined) {
        buf = new Uint8Array(array, byteOffset)
      } else {
        buf = new Uint8Array(array, byteOffset, length)
      }

      // Return an augmented `Uint8Array` instance
      buf.__proto__ = Buffer.prototype
      return buf
    }

    function fromObject (obj) {
      if (Buffer.isBuffer(obj)) {
        var len = checked(obj.length) | 0
        var buf = createBuffer(len)

        if (buf.length === 0) {
          return buf
        }

        obj.copy(buf, 0, 0, len)
        return buf
      }

      if (obj) {
        if (ArrayBuffer.isView(obj) || 'length' in obj) {
          if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
            return createBuffer(0)
          }
          return fromArrayLike(obj)
        }

        if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
          return fromArrayLike(obj.data)
        }
      }

      throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.')
    }

    function checked (length) {
      // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
      // length is NaN (which is otherwise coerced to zero.)
      if (length >= K_MAX_LENGTH) {
        throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
          'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
      }
      return length | 0
    }

    function SlowBuffer (length) {
      if (+length != length) { // eslint-disable-line eqeqeq
        length = 0
      }
      return Buffer.alloc(+length)
    }

    Buffer.isBuffer = function isBuffer (b) {
      return b != null && b._isBuffer === true
    }

    Buffer.compare = function compare (a, b) {
      if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
        throw new TypeError('Arguments must be Buffers')
      }

      if (a === b) return 0

      var x = a.length
      var y = b.length

      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i]
          y = b[i]
          break
        }
      }

      if (x < y) return -1
      if (y < x) return 1
      return 0
    }

    Buffer.isEncoding = function isEncoding (encoding) {
      switch (String(encoding).toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'latin1':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return true
        default:
          return false
      }
    }

    Buffer.concat = function concat (list, length) {
      if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }

      if (list.length === 0) {
        return Buffer.alloc(0)
      }

      var i
      if (length === undefined) {
        length = 0
        for (i = 0; i < list.length; ++i) {
          length += list[i].length
        }
      }

      var buffer = Buffer.allocUnsafe(length)
      var pos = 0
      for (i = 0; i < list.length; ++i) {
        var buf = list[i]
        if (ArrayBuffer.isView(buf)) {
          buf = Buffer.from(buf)
        }
        if (!Buffer.isBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers')
        }
        buf.copy(buffer, pos)
        pos += buf.length
      }
      return buffer
    }

    function byteLength (string, encoding) {
      if (Buffer.isBuffer(string)) {
        return string.length
      }
      if (ArrayBuffer.isView(string) || isArrayBuffer(string)) {
        return string.byteLength
      }
      if (typeof string !== 'string') {
        string = '' + string
      }

      var len = string.length
      if (len === 0) return 0

      // Use a for loop to avoid recursion
      var loweredCase = false
      for (;;) {
        switch (encoding) {
          case 'ascii':
          case 'latin1':
          case 'binary':
            return len
          case 'utf8':
          case 'utf-8':
          case undefined:
            return utf8ToBytes(string).length
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return len * 2
          case 'hex':
            return len >>> 1
          case 'base64':
            return base64ToBytes(string).length
          default:
            if (loweredCase) return utf8ToBytes(string).length // assume utf8
            encoding = ('' + encoding).toLowerCase()
            loweredCase = true
        }
      }
    }
    Buffer.byteLength = byteLength

    function slowToString (encoding, start, end) {
      var loweredCase = false

      // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
      // property of a typed array.

      // This behaves neither like String nor Uint8Array in that we set start/end
      // to their upper/lower bounds if the value passed is out of range.
      // undefined is handled specially as per ECMA-262 6th Edition,
      // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
      if (start === undefined || start < 0) {
        start = 0
      }
      // Return early if start > this.length. Done here to prevent potential uint32
      // coercion fail below.
      if (start > this.length) {
        return ''
      }

      if (end === undefined || end > this.length) {
        end = this.length
      }

      if (end <= 0) {
        return ''
      }

      // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
      end >>>= 0
      start >>>= 0

      if (end <= start) {
        return ''
      }

      if (!encoding) encoding = 'utf8'

      while (true) {
        switch (encoding) {
          case 'hex':
            return hexSlice(this, start, end)

          case 'utf8':
          case 'utf-8':
            return utf8Slice(this, start, end)

          case 'ascii':
            return asciiSlice(this, start, end)

          case 'latin1':
          case 'binary':
            return latin1Slice(this, start, end)

          case 'base64':
            return base64Slice(this, start, end)

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return utf16leSlice(this, start, end)

          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = (encoding + '').toLowerCase()
            loweredCase = true
        }
      }
    }

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
    Buffer.prototype._isBuffer = true

    function swap (b, n, m) {
      var i = b[n]
      b[n] = b[m]
      b[m] = i
    }

    Buffer.prototype.swap16 = function swap16 () {
      var len = this.length
      if (len % 2 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 16-bits')
      }
      for (var i = 0; i < len; i += 2) {
        swap(this, i, i + 1)
      }
      return this
    }

    Buffer.prototype.swap32 = function swap32 () {
      var len = this.length
      if (len % 4 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 32-bits')
      }
      for (var i = 0; i < len; i += 4) {
        swap(this, i, i + 3)
        swap(this, i + 1, i + 2)
      }
      return this
    }

    Buffer.prototype.swap64 = function swap64 () {
      var len = this.length
      if (len % 8 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 64-bits')
      }
      for (var i = 0; i < len; i += 8) {
        swap(this, i, i + 7)
        swap(this, i + 1, i + 6)
        swap(this, i + 2, i + 5)
        swap(this, i + 3, i + 4)
      }
      return this
    }

    Buffer.prototype.toString = function toString () {
      var length = this.length
      if (length === 0) return ''
      if (arguments.length === 0) return utf8Slice(this, 0, length)
      return slowToString.apply(this, arguments)
    }

    Buffer.prototype.toLocaleString = Buffer.prototype.toString

    Buffer.prototype.equals = function equals (b) {
      if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
      if (this === b) return true
      return Buffer.compare(this, b) === 0
    }

    Buffer.prototype.inspect = function inspect () {
      var str = ''
      var max = exports.INSPECT_MAX_BYTES
      if (this.length > 0) {
        str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
        if (this.length > max) str += ' ... '
      }
      return '<Buffer ' + str + '>'
    }

    Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
      if (!Buffer.isBuffer(target)) {
        throw new TypeError('Argument must be a Buffer')
      }

      if (start === undefined) {
        start = 0
      }
      if (end === undefined) {
        end = target ? target.length : 0
      }
      if (thisStart === undefined) {
        thisStart = 0
      }
      if (thisEnd === undefined) {
        thisEnd = this.length
      }

      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError('out of range index')
      }

      if (thisStart >= thisEnd && start >= end) {
        return 0
      }
      if (thisStart >= thisEnd) {
        return -1
      }
      if (start >= end) {
        return 1
      }

      start >>>= 0
      end >>>= 0
      thisStart >>>= 0
      thisEnd >>>= 0

      if (this === target) return 0

      var x = thisEnd - thisStart
      var y = end - start
      var len = Math.min(x, y)

      var thisCopy = this.slice(thisStart, thisEnd)
      var targetCopy = target.slice(start, end)

      for (var i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i]
          y = targetCopy[i]
          break
        }
      }

      if (x < y) return -1
      if (y < x) return 1
      return 0
    }

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
    function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
      // Empty buffer means no match
      if (buffer.length === 0) return -1

      // Normalize byteOffset
      if (typeof byteOffset === 'string') {
        encoding = byteOffset
        byteOffset = 0
      } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff
      } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000
      }
      byteOffset = +byteOffset  // Coerce to Number.
      if (numberIsNaN(byteOffset)) {
        // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
        byteOffset = dir ? 0 : (buffer.length - 1)
      }

      // Normalize byteOffset: negative offsets start from the end of the buffer
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset
      if (byteOffset >= buffer.length) {
        if (dir) return -1
        else byteOffset = buffer.length - 1
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0
        else return -1
      }

      // Normalize val
      if (typeof val === 'string') {
        val = Buffer.from(val, encoding)
      }

      // Finally, search either indexOf (if dir is true) or lastIndexOf
      if (Buffer.isBuffer(val)) {
        // Special case: looking for empty string/buffer always fails
        if (val.length === 0) {
          return -1
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
      } else if (typeof val === 'number') {
        val = val & 0xFF // Search for a byte value [0-255]
        if (typeof Uint8Array.prototype.indexOf === 'function') {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
          }
        }
        return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
      }

      throw new TypeError('val must be string, number or Buffer')
    }

    function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
      var indexSize = 1
      var arrLength = arr.length
      var valLength = val.length

      if (encoding !== undefined) {
        encoding = String(encoding).toLowerCase()
        if (encoding === 'ucs2' || encoding === 'ucs-2' ||
          encoding === 'utf16le' || encoding === 'utf-16le') {
          if (arr.length < 2 || val.length < 2) {
            return -1
          }
          indexSize = 2
          arrLength /= 2
          valLength /= 2
          byteOffset /= 2
        }
      }

      function read (buf, i) {
        if (indexSize === 1) {
          return buf[i]
        } else {
          return buf.readUInt16BE(i * indexSize)
        }
      }

      var i
      if (dir) {
        var foundIndex = -1
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
          } else {
            if (foundIndex !== -1) i -= i - foundIndex
            foundIndex = -1
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
        for (i = byteOffset; i >= 0; i--) {
          var found = true
          for (var j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false
              break
            }
          }
          if (found) return i
        }
      }

      return -1
    }

    Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1
    }

    Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
    }

    Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
    }

    function hexWrite (buf, string, offset, length) {
      offset = Number(offset) || 0
      var remaining = buf.length - offset
      if (!length) {
        length = remaining
      } else {
        length = Number(length)
        if (length > remaining) {
          length = remaining
        }
      }

      var strLen = string.length

      if (length > strLen / 2) {
        length = strLen / 2
      }
      for (var i = 0; i < length; ++i) {
        var parsed = parseInt(string.substr(i * 2, 2), 16)
        if (numberIsNaN(parsed)) return i
        buf[offset + i] = parsed
      }
      return i
    }

    function utf8Write (buf, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
    }

    function asciiWrite (buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length)
    }

    function latin1Write (buf, string, offset, length) {
      return asciiWrite(buf, string, offset, length)
    }

    function base64Write (buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length)
    }

    function ucs2Write (buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
    }

    Buffer.prototype.write = function write (string, offset, length, encoding) {
      // Buffer#write(string)
      if (offset === undefined) {
        encoding = 'utf8'
        length = this.length
        offset = 0
        // Buffer#write(string, encoding)
      } else if (length === undefined && typeof offset === 'string') {
        encoding = offset
        length = this.length
        offset = 0
        // Buffer#write(string, offset[, length][, encoding])
      } else if (isFinite(offset)) {
        offset = offset >>> 0
        if (isFinite(length)) {
          length = length >>> 0
          if (encoding === undefined) encoding = 'utf8'
        } else {
          encoding = length
          length = undefined
        }
      } else {
        throw new Error(
          'Buffer.write(string, encoding, offset[, length]) is no longer supported'
        )
      }

      var remaining = this.length - offset
      if (length === undefined || length > remaining) length = remaining

      if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
        throw new RangeError('Attempt to write outside buffer bounds')
      }

      if (!encoding) encoding = 'utf8'

      var loweredCase = false
      for (;;) {
        switch (encoding) {
          case 'hex':
            return hexWrite(this, string, offset, length)

          case 'utf8':
          case 'utf-8':
            return utf8Write(this, string, offset, length)

          case 'ascii':
            return asciiWrite(this, string, offset, length)

          case 'latin1':
          case 'binary':
            return latin1Write(this, string, offset, length)

          case 'base64':
            // Warning: maxLength not taken into account in base64Write
            return base64Write(this, string, offset, length)

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return ucs2Write(this, string, offset, length)

          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = ('' + encoding).toLowerCase()
            loweredCase = true
        }
      }
    }

    Buffer.prototype.toJSON = function toJSON () {
      return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
      }
    }

    function base64Slice (buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf)
      } else {
        return base64.fromByteArray(buf.slice(start, end))
      }
    }

    function utf8Slice (buf, start, end) {
      end = Math.min(buf.length, end)
      var res = []

      var i = start
      while (i < end) {
        var firstByte = buf[i]
        var codePoint = null
        var bytesPerSequence = (firstByte > 0xEF) ? 4
          : (firstByte > 0xDF) ? 3
            : (firstByte > 0xBF) ? 2
              : 1

        if (i + bytesPerSequence <= end) {
          var secondByte, thirdByte, fourthByte, tempCodePoint

          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 0x80) {
                codePoint = firstByte
              }
              break
            case 2:
              secondByte = buf[i + 1]
              if ((secondByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                if (tempCodePoint > 0x7F) {
                  codePoint = tempCodePoint
                }
              }
              break
            case 3:
              secondByte = buf[i + 1]
              thirdByte = buf[i + 2]
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                  codePoint = tempCodePoint
                }
              }
              break
            case 4:
              secondByte = buf[i + 1]
              thirdByte = buf[i + 2]
              fourthByte = buf[i + 3]
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                  codePoint = tempCodePoint
                }
              }
          }
        }

        if (codePoint === null) {
          // we did not generate a valid codePoint so insert a
          // replacement char (U+FFFD) and advance only 1 byte
          codePoint = 0xFFFD
          bytesPerSequence = 1
        } else if (codePoint > 0xFFFF) {
          // encode to utf16 (surrogate pair dance)
          codePoint -= 0x10000
          res.push(codePoint >>> 10 & 0x3FF | 0xD800)
          codePoint = 0xDC00 | codePoint & 0x3FF
        }

        res.push(codePoint)
        i += bytesPerSequence
      }

      return decodeCodePointsArray(res)
    }

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
    var MAX_ARGUMENTS_LENGTH = 0x1000

    function decodeCodePointsArray (codePoints) {
      var len = codePoints.length
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
      }

      // Decode in chunks to avoid "call stack size exceeded".
      var res = ''
      var i = 0
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        )
      }
      return res
    }

    function asciiSlice (buf, start, end) {
      var ret = ''
      end = Math.min(buf.length, end)

      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 0x7F)
      }
      return ret
    }

    function latin1Slice (buf, start, end) {
      var ret = ''
      end = Math.min(buf.length, end)

      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i])
      }
      return ret
    }

    function hexSlice (buf, start, end) {
      var len = buf.length

      if (!start || start < 0) start = 0
      if (!end || end < 0 || end > len) end = len

      var out = ''
      for (var i = start; i < end; ++i) {
        out += toHex(buf[i])
      }
      return out
    }

    function utf16leSlice (buf, start, end) {
      var bytes = buf.slice(start, end)
      var res = ''
      for (var i = 0; i < bytes.length; i += 2) {
        res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
      }
      return res
    }

    Buffer.prototype.slice = function slice (start, end) {
      var len = this.length
      start = ~~start
      end = end === undefined ? len : ~~end

      if (start < 0) {
        start += len
        if (start < 0) start = 0
      } else if (start > len) {
        start = len
      }

      if (end < 0) {
        end += len
        if (end < 0) end = 0
      } else if (end > len) {
        end = len
      }

      if (end < start) end = start

      var newBuf = this.subarray(start, end)
      // Return an augmented `Uint8Array` instance
      newBuf.__proto__ = Buffer.prototype
      return newBuf
    }

    /*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
    function checkOffset (offset, ext, length) {
      if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
      if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
    }

    Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)

      var val = this[offset]
      var mul = 1
      var i = 0
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul
      }

      return val
    }

    Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) {
        checkOffset(offset, byteLength, this.length)
      }

      var val = this[offset + --byteLength]
      var mul = 1
      while (byteLength > 0 && (mul *= 0x100)) {
        val += this[offset + --byteLength] * mul
      }

      return val
    }

    Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 1, this.length)
      return this[offset]
    }

    Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      return this[offset] | (this[offset + 1] << 8)
    }

    Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      return (this[offset] << 8) | this[offset + 1]
    }

    Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)

      return ((this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16)) +
        (this[offset + 3] * 0x1000000)
    }

    Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)

      return (this[offset] * 0x1000000) +
        ((this[offset + 1] << 16) |
          (this[offset + 2] << 8) |
          this[offset + 3])
    }

    Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)

      var val = this[offset]
      var mul = 1
      var i = 0
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul
      }
      mul *= 0x80

      if (val >= mul) val -= Math.pow(2, 8 * byteLength)

      return val
    }

    Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)

      var i = byteLength
      var mul = 1
      var val = this[offset + --i]
      while (i > 0 && (mul *= 0x100)) {
        val += this[offset + --i] * mul
      }
      mul *= 0x80

      if (val >= mul) val -= Math.pow(2, 8 * byteLength)

      return val
    }

    Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 1, this.length)
      if (!(this[offset] & 0x80)) return (this[offset])
      return ((0xff - this[offset] + 1) * -1)
    }

    Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      var val = this[offset] | (this[offset + 1] << 8)
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    }

    Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 2, this.length)
      var val = this[offset + 1] | (this[offset] << 8)
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    }

    Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)

      return (this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16) |
        (this[offset + 3] << 24)
    }

    Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)

      return (this[offset] << 24) |
        (this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        (this[offset + 3])
    }

    Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)
      return ieee754.read(this, offset, true, 23, 4)
    }

    Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 4, this.length)
      return ieee754.read(this, offset, false, 23, 4)
    }

    Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 8, this.length)
      return ieee754.read(this, offset, true, 52, 8)
    }

    Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
      offset = offset >>> 0
      if (!noAssert) checkOffset(offset, 8, this.length)
      return ieee754.read(this, offset, false, 52, 8)
    }

    function checkInt (buf, value, offset, ext, max, min) {
      if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
    }

    Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1
        checkInt(this, value, offset, byteLength, maxBytes, 0)
      }

      var mul = 1
      var i = 0
      this[offset] = value & 0xFF
      while (++i < byteLength && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF
      }

      return offset + byteLength
    }

    Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      byteLength = byteLength >>> 0
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1
        checkInt(this, value, offset, byteLength, maxBytes, 0)
      }

      var i = byteLength - 1
      var mul = 1
      this[offset + i] = value & 0xFF
      while (--i >= 0 && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF
      }

      return offset + byteLength
    }

    Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
      this[offset] = (value & 0xff)
      return offset + 1
    }

    Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
      this[offset] = (value & 0xff)
      this[offset + 1] = (value >>> 8)
      return offset + 2
    }

    Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
      this[offset] = (value >>> 8)
      this[offset + 1] = (value & 0xff)
      return offset + 2
    }

    Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
      this[offset + 3] = (value >>> 24)
      this[offset + 2] = (value >>> 16)
      this[offset + 1] = (value >>> 8)
      this[offset] = (value & 0xff)
      return offset + 4
    }

    Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
      this[offset] = (value >>> 24)
      this[offset + 1] = (value >>> 16)
      this[offset + 2] = (value >>> 8)
      this[offset + 3] = (value & 0xff)
      return offset + 4
    }

    Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        var limit = Math.pow(2, (8 * byteLength) - 1)

        checkInt(this, value, offset, byteLength, limit - 1, -limit)
      }

      var i = 0
      var mul = 1
      var sub = 0
      this[offset] = value & 0xFF
      while (++i < byteLength && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
      }

      return offset + byteLength
    }

    Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        var limit = Math.pow(2, (8 * byteLength) - 1)

        checkInt(this, value, offset, byteLength, limit - 1, -limit)
      }

      var i = byteLength - 1
      var mul = 1
      var sub = 0
      this[offset + i] = value & 0xFF
      while (--i >= 0 && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
      }

      return offset + byteLength
    }

    Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
      if (value < 0) value = 0xff + value + 1
      this[offset] = (value & 0xff)
      return offset + 1
    }

    Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
      this[offset] = (value & 0xff)
      this[offset + 1] = (value >>> 8)
      return offset + 2
    }

    Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
      this[offset] = (value >>> 8)
      this[offset + 1] = (value & 0xff)
      return offset + 2
    }

    Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
      this[offset] = (value & 0xff)
      this[offset + 1] = (value >>> 8)
      this[offset + 2] = (value >>> 16)
      this[offset + 3] = (value >>> 24)
      return offset + 4
    }

    Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
      if (value < 0) value = 0xffffffff + value + 1
      this[offset] = (value >>> 24)
      this[offset + 1] = (value >>> 16)
      this[offset + 2] = (value >>> 8)
      this[offset + 3] = (value & 0xff)
      return offset + 4
    }

    function checkIEEE754 (buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
      if (offset < 0) throw new RangeError('Index out of range')
    }

    function writeFloat (buf, value, offset, littleEndian, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
      }
      ieee754.write(buf, value, offset, littleEndian, 23, 4)
      return offset + 4
    }

    Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert)
    }

    Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert)
    }

    function writeDouble (buf, value, offset, littleEndian, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
      }
      ieee754.write(buf, value, offset, littleEndian, 52, 8)
      return offset + 8
    }

    Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert)
    }

    Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert)
    }

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    Buffer.prototype.copy = function copy (target, targetStart, start, end) {
      if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
      if (!start) start = 0
      if (!end && end !== 0) end = this.length
      if (targetStart >= target.length) targetStart = target.length
      if (!targetStart) targetStart = 0
      if (end > 0 && end < start) end = start

      // Copy 0 bytes; we're done
      if (end === start) return 0
      if (target.length === 0 || this.length === 0) return 0

      // Fatal error conditions
      if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds')
      }
      if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
      if (end < 0) throw new RangeError('sourceEnd out of bounds')

      // Are we oob?
      if (end > this.length) end = this.length
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start
      }

      var len = end - start

      if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
        // Use built-in when available, missing from IE11
        this.copyWithin(targetStart, start, end)
      } else if (this === target && start < targetStart && targetStart < end) {
        // descending copy from end
        for (var i = len - 1; i >= 0; --i) {
          target[i + targetStart] = this[i + start]
        }
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, end),
          targetStart
        )
      }

      return len
    }

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
    Buffer.prototype.fill = function fill (val, start, end, encoding) {
      // Handle string cases:
      if (typeof val === 'string') {
        if (typeof start === 'string') {
          encoding = start
          start = 0
          end = this.length
        } else if (typeof end === 'string') {
          encoding = end
          end = this.length
        }
        if (encoding !== undefined && typeof encoding !== 'string') {
          throw new TypeError('encoding must be a string')
        }
        if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
          throw new TypeError('Unknown encoding: ' + encoding)
        }
        if (val.length === 1) {
          var code = val.charCodeAt(0)
          if ((encoding === 'utf8' && code < 128) ||
            encoding === 'latin1') {
            // Fast path: If `val` fits into a single byte, use that numeric value.
            val = code
          }
        }
      } else if (typeof val === 'number') {
        val = val & 255
      }

      // Invalid ranges are not set to a default, so can range check early.
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError('Out of range index')
      }

      if (end <= start) {
        return this
      }

      start = start >>> 0
      end = end === undefined ? this.length : end >>> 0

      if (!val) val = 0

      var i
      if (typeof val === 'number') {
        for (i = start; i < end; ++i) {
          this[i] = val
        }
      } else {
        var bytes = Buffer.isBuffer(val)
          ? val
          : new Buffer(val, encoding)
        var len = bytes.length
        if (len === 0) {
          throw new TypeError('The value "' + val +
            '" is invalid for argument "value"')
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len]
        }
      }

      return this
    }

// HELPER FUNCTIONS
// ================

    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

    function base64clean (str) {
      // Node takes equal signs as end of the Base64 encoding
      str = str.split('=')[0]
      // Node strips out invalid characters like \n and \t from the string, base64-js does not
      str = str.trim().replace(INVALID_BASE64_RE, '')
      // Node converts strings with length < 2 to ''
      if (str.length < 2) return ''
      // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
      while (str.length % 4 !== 0) {
        str = str + '='
      }
      return str
    }

    function toHex (n) {
      if (n < 16) return '0' + n.toString(16)
      return n.toString(16)
    }

    function utf8ToBytes (string, units) {
      units = units || Infinity
      var codePoint
      var length = string.length
      var leadSurrogate = null
      var bytes = []

      for (var i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i)

        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
          // last char was a lead
          if (!leadSurrogate) {
            // no lead yet
            if (codePoint > 0xDBFF) {
              // unexpected trail
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              continue
            } else if (i + 1 === length) {
              // unpaired lead
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              continue
            }

            // valid lead
            leadSurrogate = codePoint

            continue
          }

          // 2 leads in a row
          if (codePoint < 0xDC00) {
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
            leadSurrogate = codePoint
            continue
          }

          // valid surrogate pair
          codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
        } else if (leadSurrogate) {
          // valid bmp char, but last char was a lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        }

        leadSurrogate = null

        // encode utf8
        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break
          bytes.push(codePoint)
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break
          bytes.push(
            codePoint >> 0x6 | 0xC0,
            codePoint & 0x3F | 0x80
          )
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break
          bytes.push(
            codePoint >> 0xC | 0xE0,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          )
        } else if (codePoint < 0x110000) {
          if ((units -= 4) < 0) break
          bytes.push(
            codePoint >> 0x12 | 0xF0,
            codePoint >> 0xC & 0x3F | 0x80,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          )
        } else {
          throw new Error('Invalid code point')
        }
      }

      return bytes
    }

    function asciiToBytes (str) {
      var byteArray = []
      for (var i = 0; i < str.length; ++i) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF)
      }
      return byteArray
    }

    function utf16leToBytes (str, units) {
      var c, hi, lo
      var byteArray = []
      for (var i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break

        c = str.charCodeAt(i)
        hi = c >> 8
        lo = c % 256
        byteArray.push(lo)
        byteArray.push(hi)
      }

      return byteArray
    }

    function base64ToBytes (str) {
      return base64.toByteArray(base64clean(str))
    }

    function blitBuffer (src, dst, offset, length) {
      for (var i = 0; i < length; ++i) {
        if ((i + offset >= dst.length) || (i >= src.length)) break
        dst[i + offset] = src[i]
      }
      return i
    }

// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
    function isArrayBuffer (obj) {
      return obj instanceof ArrayBuffer ||
        (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
          typeof obj.byteLength === 'number')
    }

    function numberIsNaN (obj) {
      return obj !== obj // eslint-disable-line no-self-compare
    }

  },{"base64-js":1,"ieee754":3}],3:[function(require,module,exports){
    exports.read = function (buffer, offset, isLE, mLen, nBytes) {
      var e, m
      var eLen = (nBytes * 8) - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var nBits = -7
      var i = isLE ? (nBytes - 1) : 0
      var d = isLE ? -1 : 1
      var s = buffer[offset + i]

      i += d

      e = s & ((1 << (-nBits)) - 1)
      s >>= (-nBits)
      nBits += eLen
      for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

      m = e & ((1 << (-nBits)) - 1)
      e >>= (-nBits)
      nBits += mLen
      for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

      if (e === 0) {
        e = 1 - eBias
      } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity)
      } else {
        m = m + Math.pow(2, mLen)
        e = e - eBias
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
    }

    exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c
      var eLen = (nBytes * 8) - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
      var i = isLE ? 0 : (nBytes - 1)
      var d = isLE ? 1 : -1
      var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

      value = Math.abs(value)

      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0
        e = eMax
      } else {
        e = Math.floor(Math.log(value) / Math.LN2)
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--
          c *= 2
        }
        if (e + eBias >= 1) {
          value += rt / c
        } else {
          value += rt * Math.pow(2, 1 - eBias)
        }
        if (value * c >= 2) {
          e++
          c /= 2
        }

        if (e + eBias >= eMax) {
          m = 0
          e = eMax
        } else if (e + eBias >= 1) {
          m = ((value * c) - 1) * Math.pow(2, mLen)
          e = e + eBias
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
          e = 0
        }
      }

      for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

      e = (e << mLen) | m
      eLen += mLen
      for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

      buffer[offset + i - d] |= s * 128
    }

  },{}],4:[function(require,module,exports){
    'use strict';

    var CTORS = {
      'int8': Int8Array,
      'uint8': Uint8Array,
      'uint8_clamped': Uint8ClampedArray,
      'int16': Int16Array,
      'uint16': Uint16Array,
      'int32': Int32Array,
      'uint32': Uint32Array,
      'float32': Float32Array,
      'float64': Float64Array,
      'generic': Array
    };


// EXPORTS //

    module.exports = CTORS;

  },{}],5:[function(require,module,exports){
    'use strict';

// CTORS //

    var CTORS = require( './ctors.js' );


// GET CTOR //

    /**
     * FUNCTION: getCtor( dtype )
     *	Returns an array constructor corresponding to an input data type.
     *
     * @param {String} dtype - data type
     * @returns {Function|Null} array constructor or null
     */
    function getCtor( dtype ) {
      return CTORS[ dtype ] || null;
    } // end FUNCTION getCtor()


// EXPORTS //

    module.exports = getCtor;

  },{"./ctors.js":4}],6:[function(require,module,exports){
    'use strict';

    var DTYPES = {
      'Int8Array': 'int8',
      'Uint8Array': 'uint8',
      'Uint8ClampedArray': 'uint8_clamped',
      'Int16Array': 'int16',
      'Uint16Array': 'uint16',
      'Int32Array': 'int32',
      'Uint32Array': 'uint32',
      'Float32Array': 'float32',
      'Float64Array': 'float64',
      'Array': 'generic'
    };


// EXPORTS //

    module.exports = DTYPES;

  },{}],7:[function(require,module,exports){
    'use strict';

// DTYPES //

    var DTYPES = require( './dtypes.js' );


// GET DTYPE //

    /**
     * FUNCTION: getType( name )
     *	Returns an array data type corresponding to an array constructor name.
     *
     * @param {String} name - constructor name
     * @returns {String|Null} array data type or null
     */
    function getType( name ) {
      return DTYPES[ name ] || null;
    } // end FUNCTION getType()


// EXPORTS //

    module.exports = getType;

  },{"./dtypes.js":6}],8:[function(require,module,exports){
    'use strict';

// MODULES //

    var typeName = require( 'type-name' ),
      getType = require( 'compute-array-dtype' );


// DTYPE //

    /**
     * FUNCTION: dtype( value )
     *	Determines the data type of an input value.
     *
     * @param {*} value - input value
     * @returns {String} data type
     */
    function dtype( value ) {
      var type,
        dt;
      if ( value === null ) {
        return 'null';
      }
      // Check for base types:
      type = typeof value;
      switch ( type ) {
        case 'undefined':
        case 'boolean':
        case 'number':
        case 'string':
        case 'function':
        case 'symbol':
          return type;
      }
      // Resort to slower look-up:
      type = typeName( value );

      // Is value a known array type?
      dt = getType( type );
      if ( dt ) {
        return dt;
      }
      // Is value a buffer object?
      if ( type === 'Buffer' || type === 'ArrayBuffer' ) {
        return 'binary';
      }
      // Assume the value is a generic object (Object|Class instance) which could contain any or multiple data types...
      return 'generic';
    } // end FUNCTION dtype()


// EXPORTS //

    module.exports = dtype;

  },{"compute-array-dtype":7,"type-name":75}],9:[function(require,module,exports){
    'use strict';

    /**
     * NOTE: the following copyright and license, as well as the long comment were part of the original implementation available as part of [FreeBSD]{@link https://svnweb.freebsd.org/base/release/9.3.0/lib/msun/src/s_erf.c?revision=268523&view=co}.
     *
     * The implementation follows the original, but has been modified for JavaScript.
     */

    /**
     * ===========================
     * Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved.
     *
     * Developed at SunPro, a Sun Microsystems, Inc business.
     * Permission to use, copy, modify, and distribute this software is freely granted, provided that this notice is preserved.
     * ===========================
     */

    /**
     * double erf(double x)
     *                               x
     *                      2       |\
     *       erf(x) = -----------   | exp(-t*t)dt
     *                   sqrt(pi)  \|
     *                              0
     *
     *		erfc(x) =  1-erf(x)
     *   Note that
     *		erf(-x) = -erf(x)
     *		erfc(-x) = 2 - erfc(x)
     *
     * Method:
     *	1. For |x| in [0, 0.84375)
     *       erf(x)  = x + x*R(x^2)
     *       erfc(x) = 1 - erf(x)           if x in [-.84375,0.25]
     *               = 0.5 + ((0.5-x)-x*R)  if x in [0.25,0.84375]
     *       where R = P/Q where P is an odd poly of degree 8 and Q is an odd poly of degree 10.
     *                                  -57.90
     *           | R - (erf(x)-x)/x | <= 2
     *
     *
     *       Remark. The formula is derived by noting
     *           erf(x) = (2/sqrt(pi))*(x - x^3/3 + x^5/10 - x^7/42 + ....)
     *       and that
     *           2/sqrt(pi) = 1.128379167095512573896158903121545171688
     *       is close to one. The interval is chosen because the fix point of erf(x) is near 0.6174 (i.e., erf(x)=x when x is near 0.6174), and by some experiment, 0.84375 is chosen to guarantee the error is less than one ulp for erf.
     *
     *   2. For |x| in [0.84375,1.25), let s = |x| - 1, and c = 0.84506291151 rounded to single (24 bits)
     *       erf(x)  = sign(x) * (c + P1(s)/Q1(s))
     *       erfc(x) = (1-c) - P1(s)/Q1(s) if x > 0
     *           1+(c+P1(s)/Q1(s))         if x < 0
     *           |P1/Q1 - (erf(|x|)-c)| <= 2**-59.06
     *   Remark: here we use the taylor series expansion at x=1.
     *       erf(1+s) = erf(1) + s*Poly(s)
     *                = 0.845.. + P1(s)/Q1(s)
     *   That is, we use rational approximation to approximate
     *       erf(1+s) - (c = (single)0.84506291151)
     *   Note that |P1/Q1|< 0.078 for x in [0.84375,1.25] where
     *       P1(s) = degree 6 poly in s
     *       Q1(s) = degree 6 poly in s
     *
     *   3. For x in [1.25,1/0.35(~2.857143)),
     *       erfc(x) = (1/x)*exp(-x*x-0.5625+R1/S1)
     *       erf(x)  = 1 - erfc(x)
     *   where
     *       R1(z) = degree 7 poly in z, (z=1/x^2)
     *       S1(z) = degree 8 poly in z
     *
     *   4. For x in [1/0.35,28]
     *       erfc(x) = (1/x)*exp(-x*x-0.5625+R2/S2)       if x > 0
     *               = 2.0 - (1/x)*exp(-x*x-0.5625+R2/S2) if -6 < x < 0
     *               = 2.0 - tiny                         if x <= -6
     *       erf(x)  = sign(x)*(1.0 - erfc(x))            if x < 6, else
     *       erf(x)  = sign(x)*(1.0 - tiny)
     *   where
     *       R2(z) = degree 6 poly in z, (z=1/x^2)
     *       S2(z) = degree 7 poly in z
     *
     *   Note1:
     *       To compute exp(-x*x-0.5625+R/S), let s be a single precision number and s := x; then
     *           -x*x = -s*s + (s-x)*(s+x)
     *           exp(-x*x-0.5626+R/S) = exp(-s*s-0.5625)*exp((s-x)*(s+x)+R/S);
     *   Note2:
     *       Here 4 and 5 make use of the asymptotic series
     *                   exp(-x*x)
     *       erfc(x) ~  ----------- * ( 1 + Poly(1/x^2) )
     *                   x*sqrt(pi)
     *       We use rational approximation to approximate
     *           g(s) = f(1/x^2) = log(erfc(x)*x) - x*x + 0.5625
     *       Here is the error bound for R1/S1 and R2/S2
     *           |R1/S1 - f(x)| < 2**(-62.57)
     *           |R2/S2 - f(x)| < 2**(-61.52)
     *
     *   5. For inf > x >= 28
     *       erf(x)  = sign(x) * (1 - tiny)   (raise inexact)
     *       erfc(x) = tiny*tiny              (raise underflow) if x > 0
     *               = 2 - tiny               if x<0
     *
     *   6. Special cases:
     *       erf(0)  = 0, erf(inf)  = 1, erf(-inf) = -1,
     *       erfc(0) = 1, erfc(inf) = 0, erfc(-inf) = 2,
     *       erfc/erf(NaN) is NaN
     */

// CONSTANTS //

    var INF = Number.POSITIVE_INFINITY,
      NINF = Number.NEGATIVE_INFINITY,

      TINY = 1e-300,
      SMALL = 1.0 / (1 << 28 ), /* 2**-28; equiv is Math.pow( 2, -28 ) */
      ERX = 8.45062911510467529297e-1, /* 0x3FEB0AC1, 0x60000000 */

      // Coefficients for approximation to erf on [0, 0.84375)
      EFX = 1.28379167095512586316e-1, /* 0x3FC06EBA, 0x8214DB69 */
      EFX8 = 1.02703333676410069053, /* 0x3FF06EBA, 0x8214DB69 */
      PP0 = 1.28379167095512558561e-1, /* 0x3FC06EBA, 0x8214DB68 */
      PP1 = -3.25042107247001499370e-1, /* 0xBFD4CD7D, 0x691CB913 */
      PP2 = -2.84817495755985104766e-2, /* 0xBF9D2A51, 0xDBD7194F */
      PP3 = -5.77027029648944159157e-3, /* 0xBF77A291, 0x236668E4 */
      PP4 = -2.37630166566501626084e-5, /* 0xBEF8EAD6, 0x120016AC */
      QQ1 = 3.97917223959155352819e-1, /* 0x3FD97779, 0xCDDADC09 */
      QQ2 = 6.50222499887672944485e-2, /* 0x3FB0A54C, 0x5536CEBA */
      QQ3 = 5.08130628187576562776e-3, /* 0x3F74D022, 0xC4D36B0F */
      QQ4 = 1.32494738004321644526e-4, /* 0x3F215DC9, 0x221C1A10 */
      QQ5 = -3.96022827877536812320e-6, /* 0xBED09C43, 0x42A26120 */

      // Coefficients for approximation to erf on [0.84375, 1.25)
      PA0 = -2.36211856075265944077e-3, /* 0xBF6359B8, 0xBEF77538 */
      PA1 = 4.14856118683748331666e-1, /* 0x3FDA8D00, 0xAD92B34D */
      PA2 = -3.72207876035701323847e-1, /* 0xBFD7D240, 0xFBB8C3F1 */
      PA3 = 3.18346619901161753674e-1, /* 0x3FD45FCA, 0x805120E4 */
      PA4 = -1.10894694282396677476e-1, /* 0xBFBC6398, 0x3D3E28EC */
      PA5 = 3.54783043256182359371e-2, /* 0x3FA22A36, 0x599795EB */
      PA6 = -2.16637559486879084300e-3, /* 0xBF61BF38, 0x0A96073F */
      QA1 = 1.06420880400844228286e-1, /* 0x3FBB3E66, 0x18EEE323 */
      QA2 = 5.40397917702171048937e-1, /* 0x3FE14AF0, 0x92EB6F33 */
      QA3 = 7.18286544141962662868e-2, /* 0x3FB2635C, 0xD99FE9A7 */
      QA4 = 1.26171219808761642112e-1, /* 0x3FC02660, 0xE763351F */
      QA5 = 1.36370839120290507362e-2, /* 0x3F8BEDC2, 0x6B51DD1C */
      QA6 = 1.19844998467991074170e-2, /* 0x3F888B54, 0x5735151D */

      // Coefficients for approximation to erfc on [1.25, 1/0.35)
      RA0 = -9.86494403484714822705e-3, /* 0xBF843412, 0x600D6435 */
      RA1 = -6.93858572707181764372e-1, /* 0xBFE63416, 0xE4BA7360 */
      RA2 = -1.05586262253232909814e1, /* 0xC0251E04, 0x41B0E726 */
      RA3 = -6.23753324503260060396e1, /* 0xC04F300A, 0xE4CBA38D */
      RA4 = -1.62396669462573470355e2, /* 0xC0644CB1, 0x84282266 */
      RA5 = -1.84605092906711035994e2, /* 0xC067135C, 0xEBCCABB2 */
      RA6 = -8.12874355063065934246e1, /* 0xC0545265, 0x57E4D2F2 */
      RA7 = -9.81432934416914548592, /* 0xC023A0EF, 0xC69AC25C */
      SA1 = 1.96512716674392571292e1, /* 0x4033A6B9, 0xBD707687 */
      SA2 = 1.37657754143519042600e2, /* 0x4061350C, 0x526AE721 */
      SA3 = 4.34565877475229228821e2, /* 0x407B290D, 0xD58A1A71 */
      SA4 = 6.45387271733267880336e2, /* 0x40842B19, 0x21EC2868 */
      SA5 = 4.29008140027567833386e2, /* 0x407AD021, 0x57700314 */
      SA6 = 1.08635005541779435134e2, /* 0x405B28A3, 0xEE48AE2C */
      SA7 = 6.57024977031928170135, /* 0x401A47EF, 0x8E484A93 */
      SA8 = -6.04244152148580987438e-2, /* 0xBFAEEFF2, 0xEE749A62 */

      // Coefficients for approximation to erfc on [1/0.35, 28]
      RB0 = -9.86494292470009928597e-3, /* 0xBF843412, 0x39E86F4A */
      RB1 = -7.99283237680523006574e-1, /* 0xBFE993BA, 0x70C285DE */
      RB2 = -1.77579549177547519889e1, /* 0xC031C209, 0x555F995A */
      RB3 = -1.60636384855821916062e2, /* 0xC064145D, 0x43C5ED98 */
      RB4 = -6.37566443368389627722e2, /* 0xC083EC88, 0x1375F228 */
      RB5 = -1.02509513161107724954e3, /* 0xC0900461, 0x6A2E5992 */
      RB6 = -4.83519191608651397019e2, /* 0xC07E384E, 0x9BDC383F */
      SB1 = 3.03380607434824582924e1, /* 0x403E568B, 0x261D5190 */
      SB2 = 3.25792512996573918826e2, /* 0x40745CAE, 0x221B9F0A */
      SB3 = 1.53672958608443695994e3, /* 0x409802EB, 0x189D5118 */
      SB4 = 3.19985821950859553908e3, /* 0x40A8FFB7, 0x688C246A */
      SB5 = 2.55305040643316442583e3, /* 0x40A3F219, 0xCEDF3BE6 */
      SB6 = 4.74528541206955367215e2, /* 0x407DA874, 0xE79FE763 */
      SB7 = -2.24409524465858183362e1; /* 0xC03670E2, 0x42712D62 */


// VARIABLES //

    var EXP = Math.exp;


// ERF //

    /**
     * FUNCTION: erf( x )
     *	Evaluates the error function for an input value.
     *
     * @param {Number} x - input value
     * @returns {Number} evaluated error function
     */
    function erf( x ) {
      var sign = false,
        tmp,
        z, r, s, y, p, q;

      // [1] Special cases...

      // NaN:
      if ( x !== x ) {
        return NaN;
      }
      // Positive infinity:
      if ( x === INF ) {
        return 1;
      }
      // Negative infinity:
      if ( x === NINF ) {
        return -1;
      }

      // [2] Get the sign:
      if ( x < 0 ) {
        x = -x;
        sign = true;
      }

      // [3] |x| < 0.84375
      if ( x < 0.84375 ) {
        if ( x < SMALL ) {
          if ( x < TINY ) {
            // Avoid underflow:
            tmp = 0.125 * (8.0*x + EFX8*x );
          } else {
            tmp = x + EFX*x;
          }
        } else {
          z = x * x;
          // Horner's method: http://en.wikipedia.org/wiki/Horner's_method
          r = PP0 + z*(PP1+z*(PP2+z*(PP3+z*PP4)));
          s = 1.0 + z*(QQ1+z*(QQ2+z*(QQ3+z*(QQ4+z*QQ5))));
          y = r / s;
          tmp = x + x*y;
        }
        if ( sign ) {
          return -tmp;
        }
        return tmp;
      }

      // [4] 0.84375 <= |x| < 1.25
      if ( x < 1.25 ) {
        s = x - 1;
        p = PA0 + s*(PA1+s*(PA2+s*(PA3+s*(PA4+s*(PA5+s*PA6)))));
        q = 1 + s*(QA1+s*(QA2+s*(QA3+s*(QA4+s*(QA5+s*QA6)))));
        if ( sign ) {
          return -ERX - p/q;
        }
        return ERX + p/q;
      }

      // [5] INF > |x| >=6
      if ( x >= 6 ) {
        if ( sign ) {
          return TINY - 1;
        }
        return 1 - TINY;
      }

      s = 1 / (x*x);

      // [6] |x| < 1 / 0.35 ~2.857143
      if ( x < 1/0.35 ) {
        r = RA0 + s*(RA1+s*(RA2+s*(RA3+s*(RA4+s*(RA5+s*(RA6+s*RA7))))));
        s = 1 + s*(SA1+s*(SA2+s*(SA3+s*(SA4+s*(SA5+s*(SA6+s*(SA7+s*SA8)))))));
      } else { // [7] |x| >= 1/0.35 ~2.857143
        r = RB0 + s*(RB1+s*(RB2+s*(RB3+s*(RB4+s*(RB5+s*RB6)))));
        s = 1 + s*(SB1+s*(SB2+s*(SB3+s*(SB4+s*(SB5+s*(SB6+s*SB7))))));
      }
      z = x & 0xffffffff00000000; // pseudo-single (20-bit) precision x;
      r = EXP( -z*z - 0.5625 ) * EXP( (z-x)*(z+x) + r/s );
      if ( sign ) {
        return r/x - 1;
      }
      return 1 - r/x;
    } // end FUNCTION erf()


// EXPORTS //

    module.exports = erf;

  },{}],10:[function(require,module,exports){
    /**
     *
     *	COMPUTE: indexspace
     *
     *
     *	DESCRIPTION:
     *		- Generates a linearly spaced index array from a subsequence string.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2015. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2015.
     *
     */

    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      isNonNegativeInteger = require( 'validate.io-nonnegative-integer' );


// VARIABLES //

    var re = /^(?:(?:-(?=\d+))?\d*|end(?:-\d+|\/\d+)?):(?:(?:-(?=\d+))?\d*|end(?:-\d+|\/\d+)?)(?:\:(?=-?\d*)(?:-?\d+)?)?$/;

    /**
     *	^(...)
     *	=> require that the string begin with either a digit (+ or -), an `end` keyword, or a colon
     *
     *	(?:(?:-(?=\d+))?\d*|end(?:-?\d+|/\\d+)?)
     *	=> match but do not capture
     *		(?:-(?=\d+))?
     *		=> match but do not capture a minus sign but only if followed by one or more digits
     *		\d*
     *		=> 0 or more digits
     *		|
     *		=> OR
     *		end(?:-\d+|/\d+)?
     *		=> the word `end` exactly, which may be followed by either a minus sign and 1 or more digits or a division sign and 1 or more digits
     *
     *	:
     *	=> match a colon exactly
     *
     *	(?:(?:-(?=\d+))?\d*|end(?:-\d+|/\\d+)?)
     *	=> same as above
     *
     *	(?:\:(?=-?\d*)(?:-?\d+)?)?
     *	=> match but do not capture
     *		\:(?=-?\d*)
     *		=> a colon but only if followed by either a possible minus sign and 0 or more digits
     *		(?:-?\d+)?
     *		=> match but do not capture a possible minus sign and 1 or more digits
     *
     *	$
     *	=> require that the string end with either a digit, `end` keyword, or a colon.
     *
     *
     * Examples:
     *	-	:
     *	-	::
     *	-	4:
     *	-	:4
     *	-	::-1
     *	-	3::-1
     *	-	:10:2
     *	-	1:3:1
     *	-	9:1:-3
     *	-	1:-1
     *	-	:-1
     *	-	-5:
     *	-	1:-5:2
     *	-	-9:10:1
     *	-	-9:-4:2
     *	-	-4:-9:-2
     *	-	1:end:2
     *	-	:end/2
     *	-	end/2:end:5
     */

    var reEnd = /^end/,
      reMatch = /(-|\/)(?=\d+)(\d+)?$/;


// INDEXSPACE

    /**
     * FUNCTION: indexspace( str, len )
     *	Generates a linearly spaced index array from a subsequence string.
     *
     * @param {String} str - subsequence string
     * @param {Number} len - reference array length
     * @returns {Number[]} array of indices
     */
    function indexspace( str, len ) {
      var x1,
        x2,
        tmp,
        inc,
        arr;
      if ( !isString( str ) || !re.test( str ) ) {
        throw new Error( 'indexspace()::invalid input argument. Invalid subsequence syntax. Please consult documentation. Value: `' + str + '`.' );
      }
      if ( !isNonNegativeInteger( len ) ) {
        throw new TypeError( 'indexspace()::invalid input argument. Reference array length must be a nonnegative integer. Value: `' + len + '`.' );
      }
      if ( !len ) {
        return [];
      }
      str = str.split( ':' );
      x1 = str[ 0 ];
      x2 = str[ 1 ];

      if ( str.length === 2 ) {
        inc = 1;
      } else {
        inc = parseInt( str[ 2 ], 10 );
      }
      // Handle zero increment...
      if ( inc === 0 ) {
        throw new Error( 'indexspace()::invalid syntax. Increment must be an integer not equal to 0. Value: `' + inc + '`.' );
      }

      // START //

      // Handle use of 'end' keyword...
      if ( reEnd.test( x1 ) ) {
        tmp = x1.match( reMatch );
        if ( tmp ) {
          if ( tmp[ 1 ] === '-' ) {
            x1 = len - 1 - parseInt( tmp[ 2 ], 10 );
            if ( x1 < 0 ) {
              // WARNING: forgive the user for exceeding the range bounds...
              x1 = 0;
            }
          } else {
            x1 = (len-1) / parseInt( tmp[ 2 ], 10 );
            x1 = Math.ceil( x1 );
          }
        } else {
          x1 = len - 1;
        }
      } else {
        x1 = parseInt( x1, 10 );

        // Handle empty index...
        if ( x1 !== x1 ) {
          // :-?\d*:-?\d+
          if ( inc < 0 ) {
            // Max index:
            x1 = len - 1;
          } else {
            // Min index:
            x1 = 0;
          }
        }
        // Handle negative index...
        else if ( x1 < 0 ) {
          x1 = len + x1; // len-x1
          if ( x1 < 0 ) {
            // WARNING: forgive the user for exceeding index bounds...
            x1 = 0;
          }
        }
        // Handle exceeding bounds...
        else if ( x1 >= len ) {
          return [];
        }
      }

      // END //

      // NOTE: here, we determine an inclusive `end` value; i.e., the last acceptable index value.

      // Handle use of 'end' keyword...
      if ( reEnd.test( x2 ) ) {
        tmp = x2.match( reMatch );
        if ( tmp ) {
          if ( tmp[ 1 ] === '-' ) {
            x2 = len - 1 - parseInt( tmp[ 2 ], 10 );
            if ( x2 < 0 ) {
              // WARNING: forgive the user for exceeding the range bounds...
              x2 = 0;
            }
          } else {
            x2 = (len-1) / parseInt( tmp[ 2 ], 10 );
            x2 = Math.ceil( x2 ) - 1;
          }
        } else {
          x2 = len - 1;
        }
      } else {
        x2 = parseInt( x2, 10 );

        // Handle empty index...
        if ( x2 !== x2 ) {
          // -?\d*::-?\d+
          if ( inc < 0 ) {
            // Min index:
            x2 = 0;
          } else {
            // Max index:
            x2 = len - 1;
          }
        }
        // Handle negative index...
        else if ( x2 < 0 ) {
          x2 = len + x2; // len-x2
          if ( x2 < 0 ) {
            // WARNING: forgive the user for exceeding index bounds...
            x2 = 0;
          }
          if ( inc > 0 ) {
            x2 = x2 - 1;
          }
        }
        // Handle positive index...
        else {
          if ( inc < 0 ) {
            x2 = x2 + 1;
          }
          else if ( x2 >= len ) {
            x2 = len - 1;
          }
          else {
            x2 = x2 - 1;
          }
        }
      }

      // INDICES //

      arr = [];
      if ( inc < 0 ) {
        if ( x2 > x1 ) {
          return arr;
        }
        while ( x1 >= x2 ) {
          arr.push( x1 );
          x1 += inc;
        }
      } else {
        if ( x1 > x2 ) {
          return arr;
        }
        while ( x1 <= x2 ) {
          arr.push( x1 );
          x1 += inc;
        }
      }
      return arr;
    } // end FUNCTION indexspace()


// EXPORTS //

    module.exports = indexspace;

  },{"validate.io-nonnegative-integer":106,"validate.io-string-primitive":112}],11:[function(require,module,exports){
    'use strict';

// EXPORTS //

    module.exports = 4294967295; // 2**32 - 1

  },{}],12:[function(require,module,exports){
    'use strict';

// EXPORTS //

    module.exports = Number.NEGATIVE_INFINITY;

  },{}],13:[function(require,module,exports){
    'use strict';

// EXPORTS //

    module.exports = 3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679;

  },{}],14:[function(require,module,exports){
    'use strict';

// EXPORTS //

    module.exports = Number.POSITIVE_INFINITY;

  },{}],15:[function(require,module,exports){
    'use strict';

// MODULES //

    var partial = require( './partial.js' );


// CDF //

    /**
     * FUNCTION: cdf( out, arr, mu, sigma, accessor )
     *	Evaluates the cumulative distribution function (CDF) for a Normal distribution with mean `mu` and standard deviation `sigma` using an accessor function.
     *
     * @param {Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} out - output array
     * @param {Array} arr - input array
     * @param {Number} mu - mean
     * @param {Number} sigma - standard deviation
     * @param {Function} accessor - accessor function for accessing array values
     * @returns {Number[]|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} output array
     */
    function cdf( y, x, mu, sigma, clbk ) {
      var len = x.length,
        fcn,
        v, i;

      fcn = partial( mu, sigma );
      for ( i = 0; i < len; i++ ) {
        v = clbk( x[ i ], i );
        if ( typeof v === 'number' ) {
          y[ i ] = fcn( v );
        } else {
          y[ i ] = NaN;
        }
      }
      return y;
    } // end FUNCTION cdf()


// EXPORTS //

    module.exports = cdf;

  },{"./partial.js":21}],16:[function(require,module,exports){
    'use strict';

// MODULES //

    var partial = require( './partial.js' );


// CDF //

    /**
     * FUNCTION: cdf( out, arr, mu, sigma )
     *	Evaluates the cumulative distribution function (CDF) for a Normal distribution with mean `mu` and standard deviation `sigma` for each array element.
     *
     * @param {Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} out - output array
     * @param {Array} arr - input array
     * @param {Number} mu - mean
     * @param {Number} sigma - standard deviation
     * @returns {Number[]|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} output array
     */
    function cdf( y, x, mu, sigma ) {
      var len = x.length,
        fcn,
        i;

      fcn = partial( mu, sigma );
      for ( i = 0; i < len; i++ ) {
        if ( typeof x[ i ] === 'number' ) {
          y[ i ] = fcn( x[ i ] );
        } else {
          y[ i ] = NaN;
        }
      }
      return y;
    } // end FUNCTION cdf()


// EXPORTS //

    module.exports = cdf;

  },{"./partial.js":21}],17:[function(require,module,exports){
    'use strict';

// MODULES //

    var deepSet = require( 'utils-deep-set' ).factory,
      deepGet = require( 'utils-deep-get' ).factory,
      partial = require( './partial.js' );


// CDF //

    /**
     * FUNCTION: cdf( arr, mu, sigma, path[, sep] )
     *	Evaluates the cumulative distribution function (CDF) for a Normal distribution with mean `mu` and standard deviation `sigma` for each array element and sets the input array.
     *
     * @param {Array} arr - input array
     * @param {Number} mu - mean
     * @param {Number} sigma - standard deviation
     * @param {String} path - key path used when deep getting and setting
     * @param {String} [sep] - key path separator
     * @returns {Array} input array
     */
    function cdf( x, mu, sigma, path, sep ) {
      var len = x.length,
        opts = {},
        dget,
        dset,
        fcn,
        v, i;
      if ( arguments.length > 4 ) {
        opts.sep = sep;
      }
      if ( len ) {
        dget = deepGet( path, opts );
        dset = deepSet( path, opts );
        fcn = partial( mu, sigma );
        for ( i = 0; i < len; i++ ) {
          v = dget( x[ i ] );
          if ( typeof v === 'number' ) {
            dset( x[i], fcn( v ) );
          } else {
            dset( x[i], NaN );
          }
        }
      }
      return x;
    } // end FUNCTION cdf()


// EXPORTS //

    module.exports = cdf;

  },{"./partial.js":21,"utils-deep-get":85,"utils-deep-set":90}],18:[function(require,module,exports){
    'use strict';

// MODULES //

    var isNumber = require( 'validate.io-number-primitive' ),
      isArrayLike = require( 'validate.io-array-like' ),
      isTypedArrayLike = require( 'validate.io-typed-array-like' ),
      isMatrixLike = require( 'validate.io-matrix-like' ),
      ctors = require( 'compute-array-constructors' ),
      matrix = require( 'dstructs-matrix' ),
      validate = require( './validate.js' );


// FUNCTIONS //

    var cdf1 = require( './number.js' ),
      cdf2 = require( './array.js' ),
      cdf3 = require( './accessor.js' ),
      cdf4 = require( './deepset.js' ),
      cdf5 = require( './matrix.js' ),
      cdf6 = require( './typedarray.js' );


// CDF //

    /**
     * FUNCTION: cdf( x[, opts] )
     *	Evaluates the cumulative distribution function (CDF) for a Normal distribution.
     *
     * @param {Number|Number[]|Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|Matrix} x - input value
     * @param {Object} [opts] - function options
     * @param {Number} [opts.mu=0] - mean
     * @param {Number} [opts.sigma=1] - standard deviation
     * @param {Boolean} [opts.copy=true] - boolean indicating if the function should return a new data structure
     * @param {Function} [opts.accessor] - accessor function for accessing array values
     * @param {String} [opts.path] - deep get/set key path
     * @param {String} [opts.sep="."] - deep get/set key path separator
     * @param {String} [opts.dtype="float64"] - output data type
     * @returns {Number|Number[]|Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|Matrix} evaluated CDF
     */
    function cdf( x, options ) {
      /* jshint newcap:false */
      var opts = {},
        ctor,
        err,
        out,
        dt,
        d;

      if ( arguments.length > 1 ) {
        err = validate( opts, options );
        if ( err ) {
          throw err;
        }
      }
      opts.mu = typeof opts.mu !== 'undefined' ? opts.mu : 0;
      opts.sigma = typeof opts.sigma !== 'undefined' ? opts.sigma : 1;

      if ( isNumber( x ) ) {
        return cdf1( x, opts.mu, opts.sigma );
      }
      if ( isMatrixLike( x ) ) {
        if ( opts.copy !== false ) {
          dt = opts.dtype || 'float64';
          ctor = ctors( dt );
          if ( ctor === null ) {
            throw new Error( 'cdf()::invalid option. Data type option does not have a corresponding array constructor. Option: `' + dt + '`.' );
          }
          // Create an output matrix:
          d = new ctor( x.length );
          out = matrix( d, x.shape, dt );
        } else {
          out = x;
        }
        return cdf5( out, x, opts.mu, opts.sigma );
      }
      if ( isTypedArrayLike( x ) ) {
        if ( opts.copy === false ) {
          out = x;
        } else {
          dt = opts.dtype || 'float64';
          ctor = ctors( dt );
          if ( ctor === null ) {
            throw new Error( 'cdf()::invalid option. Data type option does not have a corresponding array constructor. Option: `' + dt + '`.' );
          }
          out = new ctor( x.length );
        }
        return cdf6( out, x, opts.mu, opts.sigma );
      }
      if ( isArrayLike( x ) ) {
        // Handle deepset first...
        if ( opts.path ) {
          opts.sep = opts.sep || '.';
          return cdf4( x, opts.mu, opts.sigma, opts.path, opts.sep );
        }
        // Handle regular and accessor arrays next...
        if ( opts.copy === false ) {
          out = x;
        }
        else if ( opts.dtype ) {
          ctor = ctors( opts.dtype );
          if ( ctor === null ) {
            throw new TypeError( 'cdf()::invalid option. Data type option does not have a corresponding array constructor. Option: `' + opts.dtype + '`.' );
          }
          out = new ctor( x.length );
        }
        else {
          out = new Array( x.length );
        }
        if ( opts.accessor ) {
          return cdf3( out, x, opts.mu, opts.sigma, opts.accessor );
        }
        return cdf2( out, x, opts.mu, opts.sigma );
      }
      return NaN;
    } // end FUNCTION cdf()


// EXPORTS //

    module.exports = cdf;

  },{"./accessor.js":15,"./array.js":16,"./deepset.js":17,"./matrix.js":19,"./number.js":20,"./typedarray.js":22,"./validate.js":23,"compute-array-constructors":5,"dstructs-matrix":46,"validate.io-array-like":94,"validate.io-matrix-like":102,"validate.io-number-primitive":108,"validate.io-typed-array-like":113}],19:[function(require,module,exports){
    'use strict';

// MODULES //

    var partial = require( './partial.js' );


// CDF //

    /**
     * FUNCTION: cdf( out, matrix, mu, sigma )
     *	Evaluates the cumulative distribution function (CDF) for a Normal distribution with mean `mu` and standard deviation `sigma` for each matrix element.
     *
     * @param {Matrix} out - output matrix
     * @param {Matrix} arr - input matrix
     * @param {Number} mu - mean
     * @param {Number} sigma - standard deviation
     * @returns {Matrix} output matrix
     */
    function cdf( y, x, mu, sigma ) {
      var len = x.length,
        fcn,
        i;
      if ( y.length !== len ) {
        throw new Error( 'cdf()::invalid input arguments. Input and output matrices must be the same length.' );
      }
      fcn = partial( mu, sigma );
      for ( i = 0; i < len; i++ ) {
        y.data[ i ] = fcn( x.data[ i ] );
      }
      return y;
    } // end FUNCTION cdf()


// EXPORTS //

    module.exports = cdf;

  },{"./partial.js":21}],20:[function(require,module,exports){
    'use strict';

// MODULES //

    var erf = require( 'compute-erf/lib/number.js' );


// FUNCTIONS //

    var sqrt = Math.sqrt;


// CDF //

    /**
     * FUNCTION: cdf( x, mu, sigma )
     *	Evaluates the cumulative distribution function (CDF) for a Normal distribution with mean `mu` and standard deviation `sigma` at a value `x`.
     *
     * @param {Number} x - input value
     * @param {Number} mu - mean
     * @param {Number} sigma - standard deviation
     * @returns {Number} evaluated CDF
     */
    function cdf( x, mu, sigma ) {
      if( sigma === 0 ) {
        return (x < mu) ? 0 : 1;
      }
      var A = 1 / 2,
        B = sigma * sqrt( 2 ),
        C = x - mu;
      return A * ( 1 + erf( C / B ) );
    } // end FUNCTION cdf()


// EXPORTS //

    module.exports = cdf;

  },{"compute-erf/lib/number.js":9}],21:[function(require,module,exports){
    'use strict';

// MODULES //

    var erf = require( 'compute-erf/lib/number.js' );


// FUNCTIONS //

    var sqrt = Math.sqrt;


// PARTIAL //

    /**
     * FUNCTION: partial( mu, sigma )
     *	Partially applies mean `mu` and standard deviation `sigma` and returns a function for evaluating the cumulative distribution function (CDF) for a Normal distribution.
     *
     * @param {Number} mu - mean
     * @param {Number} sigma - standard deviation
     * @returns {Function} CDF
     */
    function partial( mu, sigma ) {
      var A = 1 / 2,
        B = sigma * sqrt( 2 );
      /**
       * FUNCTION: cdf( x )
       *	Evaluates the cumulative distribution function (CDF) for a Normal distribution.
       *
       * @private
       * @param {Number} x - input value
       * @returns {Number} evaluated CDF
       */
      if( sigma === 0 ) {
        return function cdf( x ) {
          return (x < mu) ? 0 : 1;
        };
      }
      return function cdf( x ) {
        var C = x - mu;
        return A * ( 1 + erf( C / B ) );
      };
    } // end FUNCTION partial()


// EXPORTS //

    module.exports = partial;

  },{"compute-erf/lib/number.js":9}],22:[function(require,module,exports){
    'use strict';

// MODULES //

    var partial = require( './partial.js' );


// CDF //

    /**
     * FUNCTION: cdf( out, arr, mu, sigma )
     *	Evaluates the cumulative distribution function (CDF) for a Normal distribution with mean `mu` and standard deviation `sigma` for each array element.
     *
     * @param {Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} out - output array
     * @param {Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} arr - input array
     * @param {Number} mu - mean
     * @param {Number} sigma - standard deviation
     * @returns {Number[]|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} output array
     */
    function cdf( y, x, mu, sigma ) {
      var len = x.length,
        fcn,
        i;

      fcn = partial ( mu, sigma );
      for ( i = 0; i < len; i++ ) {
        y[ i ] = fcn( x[ i ] );
      }
      return y;
    } // end FUNCTION cdf()


// EXPORTS //

    module.exports = cdf;

  },{"./partial.js":21}],23:[function(require,module,exports){
    'use strict';

// MODULES //

    var isObject = require( 'validate.io-object' ),
      isNumber = require( 'validate.io-number-primitive' ),
      isNonNegative = require( 'validate.io-nonnegative' ),
      isBoolean = require( 'validate.io-boolean-primitive' ),
      isFunction = require( 'validate.io-function' ),
      isString = require( 'validate.io-string-primitive' );


// VALIDATE //

    /**
     * FUNCTION: validate( opts, options )
     *	Validates function options.
     *
     * @param {Object} opts - destination for validated options
     * @param {Object} options - function options
     * @param {Number} [options.mu] - mean
     * @param {Number} [options.sigma] - standard deviation
     * @param {Boolean} [options.copy] - boolean indicating if the function should return a new data structure
     * @param {Function} [options.accessor] - accessor function for accessing array values
     * @param {String} [options.sep] - deep get/set key path separator
     * @param {String} [options.path] - deep get/set key path
     * @param {String} [options.dtype] - output data type
     * @returns {Null|Error} null or an error
     */
    function validate( opts, options ) {
      if ( !isObject( options ) ) {
        return new TypeError( 'cdf()::invalid input argument. Options argument must be an object. Value: `' + options + '`.' );
      }
      if ( options.hasOwnProperty( 'mu' ) ) {
        opts.mu = options.mu;
        if ( !isNumber( opts.mu ) ) {
          return new TypeError( 'cdf()::invalid option. `mu` parameter must be a number primitive. Option: `' + opts.mu + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'sigma' ) ) {
        opts.sigma = options.sigma;
        if ( !isNonNegative( opts.sigma ) ) {
          return new TypeError( 'cdf()::invalid option. `sigma` parameter must be a non-negative number. Option: `' + opts.sigma + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'copy' ) ) {
        opts.copy = options.copy;
        if ( !isBoolean( opts.copy ) ) {
          return new TypeError( 'cdf()::invalid option. Copy option must be a boolean primitive. Option: `' + opts.copy + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'accessor' ) ) {
        opts.accessor = options.accessor;
        if ( !isFunction( opts.accessor ) ) {
          return new TypeError( 'cdf()::invalid option. Accessor must be a function. Option: `' + opts.accessor + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'path' ) ) {
        opts.path = options.path;
        if ( !isString( opts.path ) ) {
          return new TypeError( 'cdf()::invalid option. Key path option must be a string primitive. Option: `' + opts.path + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'sep' ) ) {
        opts.sep = options.sep;
        if ( !isString( opts.sep ) ) {
          return new TypeError( 'cdf()::invalid option. Separator option must be a string primitive. Option: `' + opts.sep + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'dtype' ) ) {
        opts.dtype = options.dtype;
        if ( !isString( opts.dtype ) ) {
          return new TypeError( 'cdf()::invalid option. Data type option must be a string primitive. Option: `' + opts.dtype + '`.' );
        }
      }
      return null;
    } // end FUNCTION validate()


// EXPORTS //

    module.exports = validate;

  },{"validate.io-boolean-primitive":96,"validate.io-function":99,"validate.io-nonnegative":107,"validate.io-number-primitive":108,"validate.io-object":110,"validate.io-string-primitive":112}],24:[function(require,module,exports){
    'use strict';

// MODULES //

    var partial = require( './partial.js' );


// PDF //

    /**
     * FUNCTION: pdf( out, arr, a, b, mu, sigma, accessor )
     *	Evaluates the probability density function (PDF) for a truncated normal distribution with endpoints `a` and `b`, mean `mu` and standard deviation `sigma` using an accessor function.
     *
     * @param {Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} out - output array
     * @param {Array} arr - input array
     * @param {Number} a - minimum support
     * @param {Number} b - maximum support
     * @param {Number} mu - location parameter
     * @param {Number} sigma - scale parameter
     * @param {Function} accessor - accessor function for accessing array values
     * @returns {Number[]|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} output array
     */
    function pdf( y, x, a, b, mu, sigma, clbk ) {
      var len = x.length,
        fcn,
        v, i;

      fcn = partial( a, b, mu, sigma );
      for ( i = 0; i < len; i++ ) {
        v = clbk( x[ i ], i );
        if ( typeof v === 'number' ) {
          y[ i ] = fcn( v );
        } else {
          y[ i ] = NaN;
        }
      }
      return y;
    } // end FUNCTION pdf()


// EXPORTS //

    module.exports = pdf;

  },{"./partial.js":30}],25:[function(require,module,exports){
    'use strict';

// MODULES //

    var partial = require( './partial.js' );


// PDF //

    /**
     * FUNCTION: pdf( out, arr, a, b, mu, sigma )
     *	Evaluates the probability density function (PDF) for a truncated normal distribution with endpoints `a` and `b`, mean  `mu` and standard deviation `sigma` for each array element.
     *
     * @param {Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} out - output array
     * @param {Array} arr - input array
     * @param {Number} a - minimum support
     * @param {Number} b - maximum support
     * @param {Number} mu - location parameter
     * @param {Number} sigma - scale parameter
     * @returns {Number[]|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} output array
     */
    function pdf( y, x, a, b, mu, sigma ) {
      var len = x.length,
        fcn,
        i;

      fcn = partial( a, b, mu, sigma );
      for ( i = 0; i < len; i++ ) {
        if ( typeof x[ i ] === 'number' ) {
          y[ i ] = fcn( x[ i ] );
        } else {
          y[ i ] = NaN;
        }
      }
      return y;
    } // end FUNCTION pdf()


// EXPORTS //

    module.exports = pdf;

  },{"./partial.js":30}],26:[function(require,module,exports){
    'use strict';

// MODULES //

    var deepSet = require( 'utils-deep-set' ).factory,
      deepGet = require( 'utils-deep-get' ).factory,
      partial = require( './partial.js' );


// PDF //

    /**
     * FUNCTION: pdf( arr, a, b, mu, sigma, path[, sep] )
     *	Evaluates the probability density function (PDF) for a truncated normal distribution with endpoints `a` and `b`, mean  `mu` and standard deviation `sigma` for each array element and sets the input array.
     *
     * @param {Array} arr - input array
     * @param {Number} a - minimum support
     * @param {Number} b - maximum support
     * @param {Number} mu - location parameter
     * @param {Number} sigma - scale parameter
     * @param {String} path - key path used when deep getting and setting
     * @param {String} [sep] - key path separator
     * @returns {Array} input array
     */
    function pdf( x, a, b, mu, sigma, path, sep ) {
      var len = x.length,
        opts = {},
        dget,
        dset,
        fcn,
        v, i;
      if ( arguments.length > 6 ) {
        opts.sep = sep;
      }
      if ( len ) {
        dget = deepGet( path, opts );
        dset = deepSet( path, opts );
        fcn = partial( a, b, mu, sigma );
        for ( i = 0; i < len; i++ ) {
          v = dget( x[ i ] );
          if ( typeof v === 'number' ) {
            dset( x[i], fcn( v ) );
          } else {
            dset( x[i], NaN );
          }
        }
      }
      return x;
    } // end FUNCTION pdf()


// EXPORTS //

    module.exports = pdf;

  },{"./partial.js":30,"utils-deep-get":85,"utils-deep-set":90}],27:[function(require,module,exports){
    'use strict';

// MODULES //

    var isNumber = require( 'validate.io-number-primitive' ),
      isArrayLike = require( 'validate.io-array-like' ),
      isTypedArrayLike = require( 'validate.io-typed-array-like' ),
      isMatrixLike = require( 'validate.io-matrix-like' ),
      ctors = require( 'compute-array-constructors' ),
      matrix = require( 'dstructs-matrix' ),
      validate = require( './validate.js' );


// FUNCTIONS //

    var pdf1 = require( './number.js' ),
      pdf2 = require( './array.js' ),
      pdf3 = require( './accessor.js' ),
      pdf4 = require( './deepset.js' ),
      pdf5 = require( './matrix.js' ),
      pdf6 = require( './typedarray.js' );


// CONSTANTS //

    var NINF = require( 'const-ninf-float64'),
      PINF = require( 'const-pinf-float64' );


// PDF //

    /**
     * FUNCTION: pdf( x[, opts] )
     *	Evaluates the probability density function (PDF) for a truncated normal distribution.
     *
     * @param {Number|Number[]|Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|Matrix} x - input value
     * @param {Object} [opts] - function options
     * @param {Number} [opts.a=-Infinity] - minimum support
     * @param {Number} [opts.b=+Infinity] - maximum support
     * @param {Number} [opts.mu=0] - location parameter
     * @param {Number} [opts.sigma=1] - scale parameter
     * @param {Boolean} [opts.copy=true] - boolean indicating if the function should return a new data structure
     * @param {Function} [opts.accessor] - accessor function for accessing array values
     * @param {String} [opts.path] - deep get/set key path
     * @param {String} [opts.sep="."] - deep get/set key path separator
     * @param {String} [opts.dtype="float64"] - output data type
     * @returns {Number|Number[]|Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|Matrix} evaluated PDF
     */
    function pdf( x, options ) {
      /* jshint newcap:false */
      var opts = {},
        ctor,
        err,
        out,
        dt,
        d;

      if ( arguments.length > 1 ) {
        err = validate( opts, options );
        if ( err ) {
          throw err;
        }
      }
      opts.a = typeof opts.a !== 'undefined' ? opts.a : NINF;
      opts.b = typeof opts.b !== 'undefined' ? opts.b : PINF;
      opts.mu = typeof opts.mu !== 'undefined' ? opts.mu : 0;
      opts.sigma = typeof opts.sigma !== 'undefined' ? opts.sigma : 1;
      if ( opts.b <= opts.a ) {
        throw new TypeError( 'pdf()::invalid input options. The minimum support `a` must be less than the maximum support `b`. Options: `[' + opts.a + ',' + opts.b + ']`.' );
      }

      if ( isNumber( x ) ) {
        return pdf1( x, opts.a, opts.b, opts.mu, opts.sigma );
      }
      if ( isMatrixLike( x ) ) {
        if ( opts.copy !== false ) {
          dt = opts.dtype || 'float64';
          ctor = ctors( dt );
          if ( ctor === null ) {
            throw new Error( 'pdf()::invalid option. Data type option does not have a corresponding array constructor. Option: `' + dt + '`.' );
          }
          // Create an output matrix:
          d = new ctor( x.length );
          out = matrix( d, x.shape, dt );
        } else {
          out = x;
        }
        return pdf5( out, x, opts.a, opts.b, opts.mu, opts.sigma );
      }
      if ( isTypedArrayLike( x ) ) {
        if ( opts.copy === false ) {
          out = x;
        } else {
          dt = opts.dtype || 'float64';
          ctor = ctors( dt );
          if ( ctor === null ) {
            throw new Error( 'pdf()::invalid option. Data type option does not have a corresponding array constructor. Option: `' + dt + '`.' );
          }
          out = new ctor( x.length );
        }
        return pdf6( out, x, opts.a, opts.b, opts.mu, opts.sigma );
      }
      if ( isArrayLike( x ) ) {
        // Handle deepset first...
        if ( opts.path ) {
          opts.sep = opts.sep || '.';
          return pdf4( x, opts.a, opts.b, opts.mu, opts.sigma, opts.path, opts.sep );
        }
        // Handle regular and accessor arrays next...
        if ( opts.copy === false ) {
          out = x;
        }
        else if ( opts.dtype ) {
          ctor = ctors( opts.dtype );
          if ( ctor === null ) {
            throw new TypeError( 'pdf()::invalid option. Data type option does not have a corresponding array constructor. Option: `' + opts.dtype + '`.' );
          }
          out = new ctor( x.length );
        }
        else {
          out = new Array( x.length );
        }
        if ( opts.accessor ) {
          return pdf3( out, x, opts.a, opts.b, opts.mu, opts.sigma, opts.accessor );
        }
        return pdf2( out, x, opts.a, opts.b, opts.mu, opts.sigma );
      }
      return NaN;
    } // end FUNCTION pdf()


// EXPORTS //

    module.exports = pdf;

  },{"./accessor.js":24,"./array.js":25,"./deepset.js":26,"./matrix.js":28,"./number.js":29,"./typedarray.js":31,"./validate.js":32,"compute-array-constructors":5,"const-ninf-float64":12,"const-pinf-float64":14,"dstructs-matrix":46,"validate.io-array-like":94,"validate.io-matrix-like":102,"validate.io-number-primitive":108,"validate.io-typed-array-like":113}],28:[function(require,module,exports){
    'use strict';

// MODULES //

    var partial = require( './partial.js' );


// PDF //

    /**
     * FUNCTION: pdf( out, matrix, a, b, mu, sigma )
     *	Evaluates the probability density function (PDF) for a truncated normal distribution with endpoints `a` and `b`, mean  `mu` and standard deviation `sigma` for each matrix element.
     *
     * @param {Matrix} out - output matrix
     * @param {Matrix} arr - input matrix
     * @param {Number} a - minimum support
     * @param {Number} b - maximum support
     * @param {Number} mu - location parameter
     * @param {Number} sigma - scale parameter
     * @returns {Matrix} output matrix
     */
    function pdf( y, x, a, b, mu, sigma ) {
      var len = x.length,
        fcn,
        i;
      if ( y.length !== len ) {
        throw new Error( 'pdf()::invalid input arguments. Input and output matrices must be the same length.' );
      }
      fcn = partial( a, b, mu, sigma );
      for ( i = 0; i < len; i++ ) {
        y.data[ i ] = fcn( x.data[ i ] );
      }
      return y;
    } // end FUNCTION pdf()


// EXPORTS //

    module.exports = pdf;

  },{"./partial.js":30}],29:[function(require,module,exports){
    'use strict';

// FUNCTIONS //

    var exp = require( 'math-exp' );
    var pow = require( 'math-power' );
    var sqrt = require( 'math-sqrt' );
    var Phi = require( 'distributions-normal-cdf' );


// CONSTANTS //

    var PI = require( 'const-pi' );
    var PINF = require( 'const-pinf-float64' );


// PDF //

    /**
     * FUNCTION: pdf( x, a, b, mu, sigma )
     *	Evaluates the probability density function (PDF) for a truncated normal distribution with endpoints `a` and `b`, location parameter `mu` and scale parameter `sigma` at a value `x`.
     *
     * @param {Number} x - input value
     * @param {Number} a - minimum support
     * @param {Number} b - maximum support
     * @param {Number} mu - location parameter
     * @param {Number} sigma - scale parameter
     * @returns {Number} evaluated PDF
     */
    function pdf( x, a, b, mu, sigma ) {
      if ( x < a || x > b ) {
        return 0;
      }
      var s2 = pow( sigma, 2 );
      var A = 1 / ( sqrt( 2 * s2 * PI ) );
      var B = -1 / ( 2 * s2 );

      /* jshint newcap: false */
      var C = Phi( (b-mu)/sigma ) - Phi( (a-mu)/sigma );

      return A * exp( B * pow( x - mu, 2 ) ) / C;
    } // end FUNCTION pdf()


// EXPORTS //

    module.exports = pdf;

  },{"const-pi":13,"const-pinf-float64":14,"distributions-normal-cdf":18,"math-exp":69,"math-power":70,"math-sqrt":71}],30:[function(require,module,exports){
    'use strict';

// FUNCTIONS //

    var exp = require( 'math-exp' );
    var pow = require( 'math-power' );
    var sqrt = require( 'math-sqrt' );
    var Phi = require( 'distributions-normal-cdf' );


// VARIABLES //

    var PI = require( 'const-pi' );
    var PINF = require( 'const-pinf-float64' );


// PARTIAL //

    /**
     * FUNCTION: partial( a, b, mu, sigma )
     *	Partially applies endpoints `a` and `b`, mean  `mu` and standard deviation `sigma` and returns a function for evaluating the probability density function (PDF) for a truncated normal distribution.
     *
     * @param {Number} a - minimum support
     * @param {Number} b - maximum support
     * @param {Number} mu - location parameter
     * @param {Number} sigma - scale parameter
     * @returns {Function} PDF
     */
    function partial( a, b, mu, sigma ) {
      var s2 = pow( sigma, 2 );
      var A = 1 / ( sqrt( 2 * s2 * PI ) );
      var B = -1 / ( 2 * s2 );
      /* jshint newcap: false */
      var C = Phi( (b-mu)/sigma ) - Phi( (a-mu)/sigma );

      /**
       * FUNCTION: pdf( x )
       *	Evaluates the probability density function (PDF) for a truncated normal distribution.
       *
       * @private
       * @param {Number} x - input value
       * @returns {Number} evaluated PDF
       */
      return function pdf( x ) {
        if ( x < a || x > b ) {
          return 0;
        }
        return A * exp( B * pow( x - mu, 2 ) ) / C;
      };
    } // end FUNCTION partial()


// EXPORTS //

    module.exports = partial;

  },{"const-pi":13,"const-pinf-float64":14,"distributions-normal-cdf":18,"math-exp":69,"math-power":70,"math-sqrt":71}],31:[function(require,module,exports){
    'use strict';

// MODULES //

    var partial = require( './partial.js' );


// PDF //

    /**
     * FUNCTION: pdf( out, arr, a, b, mu, sigma )
     *	Evaluates the probability density function (PDF) for a truncated normal distribution with endpoints `a` and `b`, mean  `mu` and standard deviation `sigma` for each array element.
     *
     * @param {Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} out - output array
     * @param {Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} arr - input array
     * @param {Number} a - minimum support
     * @param {Number} b - maximum support
     * @param {Number} mu - location parameter
     * @param {Number} sigma - scale parameter
     * @returns {Number[]|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} output array
     */
    function pdf( y, x, a, b, mu, sigma ) {
      var len = x.length,
        fcn,
        i;

      fcn = partial ( a, b, mu, sigma );
      for ( i = 0; i < len; i++ ) {
        y[ i ] = fcn( x[ i ] );
      }
      return y;
    } // end FUNCTION pdf()


// EXPORTS //

    module.exports = pdf;

  },{"./partial.js":30}],32:[function(require,module,exports){
    'use strict';

// MODULES //

    var isObject = require( 'validate.io-object' ),
      isNumber = require( 'validate.io-number-primitive' ),
      isPositive = require( 'validate.io-positive-primitive' ),
      isBoolean = require( 'validate.io-boolean-primitive' ),
      isFunction = require( 'validate.io-function' ),
      isString = require( 'validate.io-string-primitive' );


// VALIDATE //

    /**
     * FUNCTION: validate( opts, options )
     *	Validates function options.
     *
     * @param {Object} opts - destination for validated options
     * @param {Object} options - function options
     * @param {Number} [options.a] - minimum support
     * @param {Number} [options.b] - maximum support
     * @param {Number} [options.mu] - location parameter
     * @param {Number} [options.sigma] - scale parameter
     * @param {Boolean} [options.copy] - boolean indicating if the function should return a new data structure
     * @param {Function} [options.accessor] - accessor function for accessing array values
     * @param {String} [options.sep] - deep get/set key path separator
     * @param {String} [options.path] - deep get/set key path
     * @param {String} [options.dtype] - output data type
     * @returns {Null|Error} null or an error
     */
    function validate( opts, options ) {
      if ( !isObject( options ) ) {
        return new TypeError( 'pdf()::invalid input argument. Options argument must be an object. Value: `' + options + '`.' );
      }
      if ( options.hasOwnProperty( 'a' ) ) {
        opts.a = options.a;
        if ( !isNumber( opts.a ) ) {
          return new TypeError( 'pdf()::invalid option. `a` parameter must be a number primitive. Option: `' + opts.a + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'b' ) ) {
        opts.b = options.b;
        if ( !isNumber( opts.b ) ) {
          return new TypeError( 'pdf()::invalid option. `b` parameter must be a number primitive. Option: `' + opts.b + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'mu' ) ) {
        opts.mu = options.mu;
        if ( !isNumber( opts.mu ) ) {
          return new TypeError( 'pdf()::invalid option. `mu` parameter must be a number primitive. Option: `' + opts.mu + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'sigma' ) ) {
        opts.sigma = options.sigma;
        if ( !isPositive( opts.sigma ) ) {
          return new TypeError( 'pdf()::invalid option. `sigma` parameter must be a non-negative number. Option: `' + opts.sigma + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'copy' ) ) {
        opts.copy = options.copy;
        if ( !isBoolean( opts.copy ) ) {
          return new TypeError( 'pdf()::invalid option. Copy option must be a boolean primitive. Option: `' + opts.copy + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'accessor' ) ) {
        opts.accessor = options.accessor;
        if ( !isFunction( opts.accessor ) ) {
          return new TypeError( 'pdf()::invalid option. Accessor must be a function. Option: `' + opts.accessor + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'path' ) ) {
        opts.path = options.path;
        if ( !isString( opts.path ) ) {
          return new TypeError( 'pdf()::invalid option. Key path option must be a string primitive. Option: `' + opts.path + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'sep' ) ) {
        opts.sep = options.sep;
        if ( !isString( opts.sep ) ) {
          return new TypeError( 'pdf()::invalid option. Separator option must be a string primitive. Option: `' + opts.sep + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'dtype' ) ) {
        opts.dtype = options.dtype;
        if ( !isString( opts.dtype ) ) {
          return new TypeError( 'pdf()::invalid option. Data type option must be a string primitive. Option: `' + opts.dtype + '`.' );
        }
      }
      return null;
    } // end FUNCTION validate()


// EXPORTS //

    module.exports = validate;

  },{"validate.io-boolean-primitive":96,"validate.io-function":99,"validate.io-number-primitive":108,"validate.io-object":110,"validate.io-positive-primitive":111,"validate.io-string-primitive":112}],33:[function(require,module,exports){
    arguments[4][4][0].apply(exports,arguments)
  },{"dup":4}],34:[function(require,module,exports){
    arguments[4][5][0].apply(exports,arguments)
  },{"./ctors.js":33,"dup":5}],35:[function(require,module,exports){
    arguments[4][6][0].apply(exports,arguments)
  },{"dup":6}],36:[function(require,module,exports){
    arguments[4][7][0].apply(exports,arguments)
  },{"./dtypes.js":35,"dup":7}],37:[function(require,module,exports){
    'use strict';

// MODULES //

    var arrayLike = require( 'validate.io-array-like' ),
      typeName = require( 'type-name' ),
      dtype = require( 'dstructs-array-dtype' ),
      getCtor = require( 'dstructs-array-constructors' );


// CAST //

    /**
     * FUNCTION: cast( x, type )
     *	Casts an input array or array-like object to a specified type.
     *
     * @param {String|Object|Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} x - value to cast
     * @param {String|Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} type - type to which to cast or a value from which the desired type should be inferred
     * @returns {Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} casted value
     */
    function cast( x, type ) {
      /* jshint newcap:false */
      var ctor,
        len,
        d,
        i;

      if ( !arrayLike( x ) ) {
        throw new TypeError( 'invalid input argument. First argument must be an array-like object. Value: `' + x + '`.' );
      }
      if ( typeof type === 'string' ) {
        ctor = getCtor( type );
      } else {
        ctor = getCtor( dtype( typeName( type ) ) );
      }
      if ( ctor === null ) {
        throw new Error( 'invalid input argument. Unrecognized/unsupported type to which to cast. Value: `' + type + '`.' );
      }
      len = x.length;

      // Ensure fast elements (contiguous memory)...
      if ( type === 'generic' && len > 64000 ) {
        d = new ctor( 64000 );
        for ( i = 0; i < 64000; i++ ) {
          d[ i ] = x[ i ];
        }
        for ( i = 64000; i < len; i++ ) {
          d.push( x[ i ] );
        }
      } else {
        d = new ctor( len );
        for ( i = 0; i < len; i++ ) {
          d[ i ] = x[ i ];
        }
      }
      return d;
    } // end FUNCTION cast()


// EXPORTS //

    module.exports = cast;

  },{"dstructs-array-constructors":34,"dstructs-array-dtype":36,"type-name":75,"validate.io-array-like":94}],38:[function(require,module,exports){
    'use strict';

// BASE TYPES //

    var BTYPES = {
      'int8': Int8Array,
      'uint8': Uint8Array,
      'uint8_clamped': Uint8ClampedArray,
      'int16': Int16Array,
      'uint16': Uint16Array,
      'int32': Int32Array,
      'uint32': Uint32Array,
      'float32': Float32Array,
      'float64': Float64Array
    };


// EXPORTS //

    module.exports = BTYPES;

  },{}],39:[function(require,module,exports){
    'use strict';

// MATRIX //

    /**
     * FUNCTION: Matrix( data, dtype, shape, offset, strides )
     *	Matrix constructor.
     *
     * @constructor
     * @param {Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} data - input typed array
     * @param {String} dtype - matrix data type
     * @param {Number[]} shape - matrix dimensions/shape
     * @param {Number} offset - matrix offset
     * @param {Number[]} strides - matrix strides
     * @returns {Matrix} Matrix instance
     */
    function Matrix( data, dtype, shape, offset, strides ) {
      if ( !( this instanceof Matrix ) ) {
        return new Matrix( data, dtype, shape, offset, strides );
      }
      // Underlying data type:
      Object.defineProperty( this, 'dtype', {
        'value': dtype,
        'configurable': false,
        'enumerable': true,
        'writable': false
      });

      // Matrix dimensions:
      Object.defineProperty( this, 'shape', {
        'value': shape,
        'configurable': false,
        'enumerable': true,
        'writable': false
      });

      // Matrix strides:
      Object.defineProperty( this, 'strides', {
        'value': strides,
        'configurable': false,
        'enumerable': true,
        'writable': false
      });

      // Matrix offset:
      Object.defineProperty( this, 'offset', {
        'value': offset,
        'configurable': false,
        'enumerable': true,
        'writable': true
      });

      // Number of matrix dimensions:
      Object.defineProperty( this, 'ndims', {
        'value': shape.length,
        'configurable': false,
        'enumerable': true,
        'writable': false
      });

      // Matrix length:
      Object.defineProperty( this, 'length', {
        'value': data.length,
        'configurable': false,
        'enumerable': true,
        'writable': false
      });

      // Number of bytes used by the matrix elements:
      Object.defineProperty( this, 'nbytes', {
        'value': data.byteLength,
        'configurable': false,
        'enumerable': true,
        'writable': false
      });

      // Matrix data store:
      Object.defineProperty( this, 'data', {
        'value': data,
        'configurable': false,
        'enumerable': true,
        'writable': false
      });

      return this;
    } // end FUNCTION Matrix()


// METHODS //

    Matrix.prototype.set = require( './set.js' );
    Matrix.prototype.iset = require( './iset.js' );
    Matrix.prototype.mset = require( './mset.js' );
    Matrix.prototype.sset = require( './sset.js' );

    Matrix.prototype.get = require( './get.js' );
    Matrix.prototype.iget = require( './iget.js' );
    Matrix.prototype.mget = require( './mget.js' );
    Matrix.prototype.sget = require( './sget.js' );

    Matrix.prototype.toString = require( './tostring.js' );
    Matrix.prototype.toJSON = require( './tojson.js' );


// EXPORTS //

    module.exports = Matrix;

  },{"./get.js":42,"./iget.js":44,"./iset.js":47,"./mget.js":51,"./mset.js":53,"./set.js":61,"./sget.js":63,"./sset.js":65,"./tojson.js":67,"./tostring.js":68}],40:[function(require,module,exports){
    'use strict';

// MATRIX //

    /**
     * FUNCTION: Matrix( data, dtype, shape, offset, strides )
     *	Matrix constructor.
     *
     * @constructor
     * @param {Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} data - input typed array
     * @param {String} dtype - matrix data type
     * @param {Number[]} shape - matrix dimensions/shape
     * @param {Number} offset - matrix offset
     * @param {Number[]} strides - matrix strides
     * @returns {Matrix} Matrix instance
     */
    function Matrix( data, dtype, shape, offset, strides ) {
      if ( !( this instanceof Matrix ) ) {
        return new Matrix( data, dtype, shape, offset, strides );
      }
      this.dtype = dtype;
      this.shape = shape;
      this.strides = strides;
      this.offset = offset;
      this.ndims = shape.length;
      this.length = data.length;
      this.nbytes = data.byteLength;
      this.data = data;
      return this;
    } // end FUNCTION Matrix()


// METHODS //

    Matrix.prototype.set = require( './set.raw.js' );
    Matrix.prototype.iset = require( './iset.raw.js' );
    Matrix.prototype.mset = require( './mset.raw.js' );
    Matrix.prototype.sset = require( './sset.raw.js' );

    Matrix.prototype.get = require( './get.raw.js' );
    Matrix.prototype.iget = require( './iget.raw.js' );
    Matrix.prototype.mget = require( './mget.raw.js' );
    Matrix.prototype.sget = require( './sget.raw.js' );

    Matrix.prototype.toString = require( './tostring.js' );
    Matrix.prototype.toJSON = require( './tojson.js' );

// EXPORTS //

    module.exports = Matrix;

  },{"./get.raw.js":43,"./iget.raw.js":45,"./iset.raw.js":48,"./mget.raw.js":52,"./mset.raw.js":54,"./set.raw.js":62,"./sget.raw.js":64,"./sset.raw.js":66,"./tojson.js":67,"./tostring.js":68}],41:[function(require,module,exports){
    'use strict';

// DATA TYPES //

    var DTYPES = [
      'int8',
      'uint8',
      'uint8_clamped',
      'int16',
      'uint16',
      'int32',
      'uint32',
      'float32',
      'float64'
    ];


// EXPORTS //

    module.exports = DTYPES;

  },{}],42:[function(require,module,exports){
    'use strict';

// MODULES //

    var isNonNegativeInteger = require( 'validate.io-nonnegative-integer' );


// GET //

    /**
     * FUNCTION: get( i, j )
     *	Returns a matrix element based on the provided row and column indices.
     *
     * @param {Number} i - row index
     * @param {Number} j - column index
     * @returns {Number|Undefined} matrix element
     */
    function get( i, j ) {
      /*jshint validthis:true */
      if ( !isNonNegativeInteger( i ) || !isNonNegativeInteger( j ) ) {
        throw new TypeError( 'invalid input argument. Indices must be nonnegative integers. Values: `[' + i + ','+ j + ']`.' );
      }
      return this.data[ this.offset + i*this.strides[0] + j*this.strides[1] ];
    } // end FUNCTION get()


// EXPORTS //

    module.exports = get;

  },{"validate.io-nonnegative-integer":106}],43:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: get( i, j )
     *	Returns a matrix element based on the provided row and column indices.
     *
     * @param {Number} i - row index
     * @param {Number} j - column index
     * @returns {Number|Undefined} matrix element
     */
    function get( i, j ) {
      /*jshint validthis:true */
      return this.data[ this.offset + i*this.strides[0] + j*this.strides[1] ];
    } // end FUNCTION get()


// EXPORTS //

    module.exports = get;

  },{}],44:[function(require,module,exports){
    'use strict';

// MODULES //

    var isInteger = require( 'validate.io-integer-primitive' );


// IGET //

    /**
     * FUNCTION: iget( idx )
     *	Returns a matrix element located at a specified index.
     *
     * @param {Number} idx - linear index
     * @returns {Number|Undefined} matrix element
     */
    function iget( idx ) {
      /*jshint validthis:true */
      var r, j;
      if ( !isInteger( idx ) ) {
        throw new TypeError( 'invalid input argument. Must provide a integer. Value: `' + idx + '`.' );
      }
      if ( idx < 0 ) {
        idx += this.length;
        if ( idx < 0 ) {
          return;
        }
      }
      j = idx % this.strides[ 0 ];
      r = idx - j;
      if ( this.strides[ 0 ] < 0 ) {
        r = -r;
      }
      return this.data[ this.offset + r + j*this.strides[1] ];
    } // end FUNCTION iget()


// EXPORTS //

    module.exports = iget;

  },{"validate.io-integer-primitive":100}],45:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: iget( idx )
     *	Returns a matrix element located at a specified index.
     *
     * @param {Number} idx - linear index
     * @returns {Number|Undefined} matrix element
     */
    function iget( idx ) {
      /*jshint validthis:true */
      var r, j;
      if ( idx < 0 ) {
        idx += this.length;
        if ( idx < 0 ) {
          return;
        }
      }
      j = idx % this.strides[ 0 ];
      r = idx - j;
      if ( this.strides[ 0 ] < 0 ) {
        r = -r;
      }
      return this.data[ this.offset + r + j*this.strides[1] ];
    } // end FUNCTION iget()


// EXPORTS //

    module.exports = iget;

  },{}],46:[function(require,module,exports){
    'use strict';

// EXPORTS //

    module.exports = require( './matrix.js' );
    module.exports.raw = require( './matrix.raw.js' );

  },{"./matrix.js":49,"./matrix.raw.js":50}],47:[function(require,module,exports){
    'use strict';

// MODULES //

    var isInteger = require( 'validate.io-integer-primitive' ),
      isnan = require( 'validate.io-nan' ),
      isNumber = require( 'validate.io-number-primitive' );


// ISET //

    /**
     * FUNCTION: iset( idx, value )
     *	Sets a matrix element located at a specified index.
     *
     * @param {Number} idx - linear index
     * @param {Number} value - value to set
     * @returns {Matrix} Matrix instance
     */
    function iset( idx, v ) {
      /* jshint validthis: true */
      var r, j;
      if ( !isInteger( idx ) ) {
        throw new TypeError( 'invalid input argument. An index must be an integer. Value: `' + idx + '`.' );
      }
      if ( !isNumber( v ) && !isnan( v ) ) {
        throw new TypeError( 'invalid input argument. An input value must be a number primitive. Value: `' + v + '`.' );
      }
      if ( idx < 0 ) {
        idx += this.length;
        if ( idx < 0 ) {
          return this;
        }
      }
      j = idx % this.strides[ 0 ];
      r = idx - j;
      if ( this.strides[ 0 ] < 0 ) {
        r = -r;
      }
      this.data[ this.offset + r + j*this.strides[1] ] = v;
      return this;
    } // end FUNCTION iset()


// EXPORTS //

    module.exports = iset;

  },{"validate.io-integer-primitive":100,"validate.io-nan":104,"validate.io-number-primitive":108}],48:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: iset( idx, value )
     *	Sets a matrix element located at a specified index.
     *
     * @param {Number} idx - linear index
     * @param {Number} value - value to set
     * @returns {Matrix} Matrix instance
     */
    function iset( idx, v ) {
      /* jshint validthis: true */
      var r, j;
      if ( idx < 0 ) {
        idx += this.length;
        if ( idx < 0 ) {
          return this;
        }
      }
      j = idx % this.strides[ 0 ];
      r = idx - j;
      if ( this.strides[ 0 ] < 0 ) {
        r = -r;
      }
      this.data[ this.offset + r + j*this.strides[1] ] = v;
      return this;
    } // end FUNCTION iset()


// EXPORTS //

    module.exports = iset;

  },{}],49:[function(require,module,exports){
    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      isNonNegativeIntegerArray = require( 'validate.io-nonnegative-integer-array' ),
      contains = require( 'validate.io-contains' ),
      isArray = require( 'validate.io-array' ),
      cast = require( 'dstructs-cast-arrays' ),
      getType = require( 'compute-dtype' ),
      Matrix = require( './ctor.js' );


// VARIABLES //

    var BTYPES = require( './btypes.js' ),
      DTYPES = require( './dtypes.js' );


// CREATE MATRIX //

    /**
     * FUNCTION: matrix( [data,] shape[, dtype] )
     *	Returns a Matrix instance.
     *
     * @constructor
     * @param {Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} [data] - input typed array
     * @param {Number[]} shape - matrix dimensions/shape
     * @param {String} [dtype="float64"] - matrix data type
     * @returns {Matrix} Matrix instance
     */
    function matrix() {
      var dtype,
        ndims,
        shape,
        data,
        vFLG,
        len,
        dt,
        i;

      // Parse the input arguments (polymorphic interface)...
      if ( arguments.length === 1 ) {
        shape = arguments[ 0 ];
        vFLG = 2; // arg #s
      }
      else if ( arguments.length === 2 ) {
        if ( isString( arguments[ 1 ] ) ) {
          shape = arguments[ 0 ];
          dtype = arguments[ 1 ];
          vFLG = 23; // arg #s
        } else {
          data = arguments[ 0 ];
          shape = arguments[ 1 ];
          vFLG = 12; // arg #s
        }
      }
      else {
        data = arguments[ 0 ];
        shape = arguments[ 1 ];
        dtype = arguments[ 2 ];
        vFLG = 123; // arg #s
      }

      // Input argument validation...
      if ( !isNonNegativeIntegerArray( shape ) ) {
        throw new TypeError( 'invalid input argument. A matrix shape must be an array of nonnegative integers. Value: `' + shape + '`.' );
      }
      ndims = shape.length;
      if ( ndims !== 2 ) {
        throw new Error( 'invalid input argument. Shape must be a 2-element array. Value: `' + shape + '`.' );
      }
      // If a `dtype` has been provided, validate...
      if ( vFLG === 123 || vFLG === 23 ) {
        if ( !contains( DTYPES, dtype ) ) {
          throw new TypeError( 'invalid input argument. Unrecognized/unsupported data type. Value: `' + dtype + '`.' );
        }
      } else {
        dtype = 'float64';
      }
      len = 1;
      for ( i = 0; i < ndims; i++ ) {
        len *= shape[ i ];
      }
      // If a `data` argument has been provided, validate...
      if ( vFLG === 123 || vFLG === 12 ) {
        dt = getType( data );
        if ( !contains( DTYPES, dt ) && !isArray( data ) ) {
          throw new TypeError( 'invalid input argument. Input data must be a valid type. Consult the documentation for a list of valid data types. Value: `' + data + '`.' );
        }
        if ( len !== data.length ) {
          throw new Error( 'invalid input argument. Matrix shape does not match the input data length.' );
        }
        // Only cast if either 1) both a `data` and `dtype` argument have been provided and they do not agree or 2) when provided a plain Array...
        if ( ( vFLG === 123 && dt !== dtype ) || dt === 'generic' ) {
          data = cast( data, dtype );
        } else {
          dtype = dt;
        }
      } else {
        // Initialize a zero-filled typed array:
        data = new BTYPES[ dtype ]( len );
      }
      // Return a new Matrix instance:
      return new Matrix( data, dtype, shape, 0, [shape[1],1] );
    } // end FUNCTION matrix()


// EXPORTS //

    module.exports = matrix;

  },{"./btypes.js":38,"./ctor.js":39,"./dtypes.js":41,"compute-dtype":8,"dstructs-cast-arrays":37,"validate.io-array":95,"validate.io-contains":98,"validate.io-nonnegative-integer-array":105,"validate.io-string-primitive":112}],50:[function(require,module,exports){
    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      contains = require( 'validate.io-contains' ),
      getType = require( 'compute-dtype' ),
      Matrix = require( './ctor.raw.js' );


// VARIABLES //

    var BTYPES = require( './btypes.js' ),
      DTYPES = require( './dtypes.js' );


// CREATE MATRIX //

    /**
     * FUNCTION: matrix( [data,] shape[, dtype] )
     *	Returns a Matrix instance.
     *
     * @constructor
     * @param {Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} [data] - input typed array
     * @param {Number[]} shape - matrix dimensions/shape
     * @param {String} [dtype="float64"] - matrix data type
     * @returns {Matrix} Matrix instance
     */
    function matrix() {
      var dtype,
        ndims,
        shape,
        data,
        len,
        i;

      if ( arguments.length === 1 ) {
        shape = arguments[ 0 ];
      }
      else if ( arguments.length === 2 ) {
        if ( isString( arguments[ 1 ] ) ) {
          shape = arguments[ 0 ];
          dtype = arguments[ 1 ];
        } else {
          data = arguments[ 0 ];
          shape = arguments[ 1 ];
        }
      }
      else {
        data = arguments[ 0 ];
        shape = arguments[ 1 ];
        dtype = arguments[ 2 ];
      }
      ndims = shape.length;
      if ( ndims !== 2 ) {
        throw new Error( 'invalid input argument. Shape must be a 2-element array. Value: `' + shape + '`.' );
      }
      len = 1;
      for ( i = 0; i < ndims; i++ ) {
        len *= shape[ i ];
      }
      if ( data ) {
        if ( !dtype ) {
          dtype = getType( data );
          if ( !contains( DTYPES, dtype ) ) {
            throw new TypeError( 'invalid input argument. Input data must be a valid type. Consult the documentation for a list of valid data types. Value: `' + data + '`.' );
          }
        }
        if ( len !== data.length ) {
          throw new Error( 'invalid input argument. Matrix shape does not match the input data length.' );
        }
      } else {
        // Initialize a zero-filled typed array...
        if ( !dtype ) {
          dtype = 'float64';
        }
        data = new BTYPES[ dtype ]( len );
      }
      // Return a new Matrix instance:
      return new Matrix( data, dtype, shape, 0, [shape[1],1] );
    } // end FUNCTION matrix()


// EXPORTS //

    module.exports = matrix;

  },{"./btypes.js":38,"./ctor.raw.js":40,"./dtypes.js":41,"compute-dtype":8,"validate.io-contains":98,"validate.io-string-primitive":112}],51:[function(require,module,exports){
    'use strict';

// MODULES //

    var isNonNegativeIntegerArray = require( 'validate.io-nonnegative-integer-array' );


// VARIABLES //

    var BTYPES = require( './btypes.js' );


// MGET //

    /**
     * FUNCTION: mget( i[, j] )
     *	Returns multiple matrix elements. If provided a single argument, `i` is treated as an array of linear indices.
     *
     * @param {Number[]|Null} i - linear/row indices
     * @param {Number[]|Null} [j] - column indices
     * @returns {Matrix} a new Matrix instance
     */
    function mget( rows, cols ) {
      /*jshint validthis:true */
      var nRows,
        nCols,
        out,
        sgn,
        d,
        s0, s1, s2, s3,
        o,
        r, dr,
        i, j, m, n;

      s0 = this.strides[ 0 ];
      s1 = this.strides[ 1 ];
      o = this.offset;

      if ( arguments.length < 2 ) {
        if ( !isNonNegativeIntegerArray( rows ) ) {
          throw new TypeError( 'invalid input argument. Linear indices must be specified as a nonnegative integer array. Value: `' + rows + '`.' );
        }
        // Filter the input indices to ensure within bounds...
        i = [];
        for ( n = 0; n < rows.length; n++ ) {
          if ( rows[ n ] < this.length ) {
            i.push( rows[ n ] );
          }
        }
        m = i.length;

        // Create a row vector (matrix):
        d = new BTYPES[ this.dtype ]( m );
        out = new this.constructor( d, this.dtype, [1,m], 0, [m,1] );

        sgn = ( s0 < 0 ) ? -1 : 1;
        for ( n = 0; n < m; n++ ) {
          j = i[ n ] % s0;
          r = sgn * ( i[n] - j );
          d[ n ] = this.data[ o + r + j*s1 ];
        }
      } else {
        nRows = this.shape[ 0 ];
        if ( rows === null ) {
          i = new Array( nRows );
          for ( n = 0; n < nRows; n++ ) {
            i[ n ] = n;
          }
        }
        else if ( isNonNegativeIntegerArray( rows ) ) {
          i = [];
          for ( n = 0; n < rows.length; n++ ) {
            if ( rows[ n ] < nRows ) {
              i.push( rows[ n ] );
            }
          }
        }
        else {
          throw new TypeError( 'invalid input argument. Row indices must be specified as a nonnegative integer array. Value: `' + rows + '`.' );
        }

        nCols = this.shape[ 1 ];
        if ( cols === null ) {
          j = new Array( nCols );
          for ( n = 0; n < nCols; n++ ) {
            j[ n ] = n;
          }
        }
        else if ( isNonNegativeIntegerArray( cols ) ) {
          j = [];
          for ( n = 0; n < cols.length; n++ ) {
            if ( cols[ n ] < nCols ) {
              j.push( cols[ n ] );
            }
          }
        }
        else {
          throw new TypeError( 'invalid input argument. Column indices must be specified as a nonnegative integer array. Value: `' + cols + '`.' );
        }
        nRows = i.length;
        nCols = j.length;

        d = new BTYPES[ this.dtype ]( nRows*nCols );
        out = new this.constructor( d, this.dtype, [nRows,nCols], 0, [nCols,1]);

        s2 = out.strides[ 0 ];
        s3 = out.strides[ 1 ];
        for ( m = 0; m < nRows; m++ ) {
          r = o + i[m]*s0;
          dr = m * s2;
          for ( n = 0; n < nCols; n++ ) {
            d[ dr + n*s3 ] = this.data[ r + j[n]*s1 ];
          }
        }
      }
      return out;
    } // end FUNCTION mget()


// EXPORTS //

    module.exports = mget;

  },{"./btypes.js":38,"validate.io-nonnegative-integer-array":105}],52:[function(require,module,exports){
    'use strict';

// VARIABLES //

    var BTYPES = require( './btypes.js' );


// MGET //

    /**
     * FUNCTION: mget( i[, j] )
     *	Returns multiple matrix elements. If provided a single argument, `i` is treated as an array of linear indices.
     *
     * @param {Number[]|Null} i - linear/row indices
     * @param {Number[]|Null} [j] - column indices
     * @returns {Matrix} a new Matrix instance
     */
    function mget( rows, cols ) {
      /*jshint validthis:true */
      var nRows,
        nCols,
        out,
        sgn,
        d,
        s0, s1, s2, s3,
        o,
        r, dr,
        i, j, m, n;

      s0 = this.strides[ 0 ];
      s1 = this.strides[ 1 ];
      o = this.offset;

      if ( arguments.length < 2 ) {
        i = rows;
        m = i.length;

        // Create a row vector (matrix):
        d = new BTYPES[ this.dtype ]( m );
        out = new this.constructor( d, this.dtype, [1,m], 0, [m,1] );

        sgn = ( s0 < 0 ) ? -1 : 1;
        for ( n = 0; n < m; n++ ) {
          j = i[ n ] % s0;
          r = sgn * ( i[n] - j );
          d[ n ] = this.data[ o + r + j*s1 ];
        }
      } else {
        if ( rows === null ) {
          nRows = this.shape[ 0 ];
          i = new Array( nRows );
          for ( n = 0; n < nRows; n++ ) {
            i[ n ] = n;
          }
        } else {
          nRows = rows.length;
          i = rows;
        }

        if ( cols === null ) {
          nCols = this.shape[ 1 ];
          j = new Array( nCols );
          for ( n = 0; n < nCols; n++ ) {
            j[ n ] = n;
          }
        } else {
          nCols = cols.length;
          j = cols;
        }

        d = new BTYPES[ this.dtype ]( nRows*nCols );
        out = new this.constructor( d, this.dtype, [nRows,nCols], 0, [nCols,1] );

        s2 = out.strides[ 0 ];
        s3 = out.strides[ 1 ];
        for ( m = 0; m < nRows; m++ ) {
          r = o + i[m]*s0;
          dr = m * s2;
          for ( n = 0; n < nCols; n++ ) {
            d[ dr + n*s3 ] = this.data[ r + j[n]*s1 ];
          }
        }
      }
      return out;
    } // end FUNCTION mget()


// EXPORTS //

    module.exports = mget;

  },{"./btypes.js":38}],53:[function(require,module,exports){
    'use strict';

// MODULES //

    var isFunction = require( 'validate.io-function' ),
      isnan = require( 'validate.io-nan' ),
      isNumber = require( 'validate.io-number-primitive' ),
      isNonNegativeIntegerArray = require( 'validate.io-nonnegative-integer-array' );


// FUNCTIONS //

    var mset1 = require( './mset1.js' ),
      mset2 = require( './mset2.js' ),
      mset3 = require( './mset3.js' ),
      mset4 = require( './mset4.js' ),
      mset5 = require( './mset5.js' ),
      mset6 = require( './mset6.js' );

    /**
     * FUNCTION: getIndices( idx, len )
     *	Validates and returns an array of indices.
     *
     * @private
     * @param {Number[]|Null} idx - indices
     * @param {Number} len - max index
     * @returns {Number[]} indices
     */
    function getIndices( idx, len ) {
      var out,
        i;
      if ( idx === null ) {
        out = new Array( len );
        for ( i = 0; i < len; i++ ) {
          out[ i ] = i;
        }
      }
      else if ( isNonNegativeIntegerArray( idx ) ) {
        out = [];
        for ( i = 0; i < idx.length; i++ ) {
          if ( idx[ i ] < len ) {
            out.push( idx[ i ] );
          }
        }
      }
      else {
        throw new TypeError( 'invalid input argument. Row and column indices must be arrays of nonnegative integers. Value: `' + idx + '`.' );
      }
      return out;
    } // end FUNCTION getIndices()


// MSET //

    /**
     * FUNCTION: mset( i[, j], value[, thisArg] )
     *	Sets multiple matrix elements. If provided a single array, `i` is treated as an array of linear indices.
     *
     * @param {Number[]|Null} i - linear/row indices
     * @param {Number[]|Null} [j] - column indices
     * @param {Number|Matrix|Function} value - either a single numeric value, a matrix containing the values to set, or a function which returns a numeric value
     * @returns {Matrix} Matrix instance
     */
    function mset() {
      /*jshint validthis:true */
      var nargs = arguments.length,
        args,
        rows,
        cols,
        i;

      args = new Array( nargs );
      for ( i = 0; i < nargs; i++ ) {
        args[ i ] = arguments[ i ];
      }

      // 2 input arguments...
      if ( nargs < 3 ) {
        if ( !isNonNegativeIntegerArray( args[ 0 ] ) ) {
          throw new TypeError( 'invalid input argument. First argument must be an array of nonnegative integers. Value: `' + args[ 0 ] + '`.' );
        }
        // indices, clbk
        if ( isFunction( args[ 1 ] ) ) {
          mset2( this, args[ 0 ], args[ 1 ] );
        }
        // indices, number
        else if ( isNumber( args[ 1 ] ) || isnan( args[ 1 ] ) ) {
          mset1( this, args[ 0 ], args[ 1 ] );
        }
        // indices, matrix
        else {
          // NOTE: no validation for Matrix instance.
          mset3( this, args[ 0 ], args[ 1 ] );
        }
      }
      // 3 input arguments...
      else if ( nargs === 3 ) {
        // indices, clbk, context
        if ( isFunction( args[ 1 ] ) ) {
          if ( !isNonNegativeIntegerArray( args[ 0 ] ) ) {
            throw new TypeError( 'invalid input argument. First argument must be an array of nonnegative integers. Value: `' + args[ 0 ] + '`.' );
          }
          mset2( this, args[ 0 ], args[ 1 ], args[ 2 ] );
        }
        // rows, cols, function
        else if ( isFunction( args[ 2 ] ) ) {
          rows = getIndices( args[ 0 ], this.shape[ 0 ] );
          cols = getIndices( args[ 1 ], this.shape[ 1 ] );
          mset4( this, rows, cols, args[ 2 ], this );
        }
        // rows, cols, number
        else if ( isNumber( args[ 2 ] ) ) {
          rows = getIndices( args[ 0 ], this.shape[ 0 ] );
          cols = getIndices( args[ 1 ], this.shape[ 1 ] );
          mset5( this, rows, cols, args[ 2 ] );
        }
        // rows, cols, matrix
        else {
          rows = getIndices( args[ 0 ], this.shape[ 0 ] );
          cols = getIndices( args[ 1 ], this.shape[ 1 ] );

          // NOTE: no validation for Matrix instance.
          mset6( this, rows, cols, args[ 2 ] );
        }
      }
      // 4 input arguments...
      else {
        // rows, cols, function, context
        if ( !isFunction( args[ 2 ] ) ) {
          throw new TypeError( 'invalid input argument. Callback argument must be a function. Value: `' + args[ 2 ] + '`.' );
        }
        rows = getIndices( args[ 0 ], this.shape[ 0 ] );
        cols = getIndices( args[ 1 ], this.shape[ 1 ] );
        mset4( this, rows, cols, args[ 2 ], args[ 3 ] );
      }
      return this;
    } // end FUNCTION mset()


// EXPORTS //

    module.exports = mset;

  },{"./mset1.js":55,"./mset2.js":56,"./mset3.js":57,"./mset4.js":58,"./mset5.js":59,"./mset6.js":60,"validate.io-function":99,"validate.io-nan":104,"validate.io-nonnegative-integer-array":105,"validate.io-number-primitive":108}],54:[function(require,module,exports){
    'use strict';

// FUNCTIONS //

    var mset1 = require( './mset1.js' ),
      mset2 = require( './mset2.js' ),
      mset3 = require( './mset3.js' ),
      mset4 = require( './mset4.js' ),
      mset5 = require( './mset5.js' ),
      mset6 = require( './mset6.js' );

    /**
     * FUNCTION: getIndices( idx, len )
     *	Returns an array of indices.
     *
     * @private
     * @param {Number[]|Null} idx - indices
     * @param {Number} len - max index
     * @returns {Number[]} indices
     */
    function getIndices( idx, len ) {
      var out,
        i;
      if ( idx === null ) {
        out = new Array( len );
        for ( i = 0; i < len; i++ ) {
          out[ i ] = i;
        }
      } else {
        out = idx;
      }
      return out;
    } // end FUNCTION getIndices()


// MSET //

    /**
     * FUNCTION: mset( i[, j], value[, thisArg] )
     *	Sets multiple matrix elements. If provided a single array, `i` is treated as an array of linear indices.
     *
     * @param {Number[]|Null} i - linear/row indices
     * @param {Number[]|Null} [j] - column indices
     * @param {Number|Matrix|Function} value - either a single numeric value, a matrix containing the values to set, or a function which returns a numeric value
     * @returns {Matrix} Matrix instance
     */
    function mset() {
      /*jshint validthis:true */
      var nargs = arguments.length,
        args,
        rows,
        cols,
        i;

      args = new Array( nargs );
      for ( i = 0; i < nargs; i++ ) {
        args[ i ] = arguments[ i ];
      }

      // 2 input arguments...
      if ( nargs < 3 ) {
        // indices, clbk
        if ( typeof args[ 1 ] === 'function' ) {
          mset2( this, args[ 0 ], args[ 1 ] );
        }
        // indices, number
        else if ( typeof args[ 1 ] === 'number' ) {
          mset1( this, args[ 0 ], args[ 1 ] );
        }
        // indices, matrix
        else {
          mset3( this, args[ 0 ], args[ 1 ] );
        }
      }
      // 3 input arguments...
      else if ( nargs === 3 ) {
        // indices, clbk, context
        if ( typeof args[ 1 ] === 'function' ) {
          mset2( this, args[ 0 ], args[ 1 ], args[ 2 ] );
        }
        // rows, cols, function
        else if ( typeof args[ 2 ] === 'function' ) {
          rows = getIndices( args[ 0 ], this.shape[ 0 ] );
          cols = getIndices( args[ 1 ], this.shape[ 1 ] );
          mset4( this, rows, cols, args[ 2 ], this );
        }
        // rows, cols, number
        else if ( typeof args[ 2 ] === 'number' ) {
          rows = getIndices( args[ 0 ], this.shape[ 0 ] );
          cols = getIndices( args[ 1 ], this.shape[ 1 ] );
          mset5( this, rows, cols, args[ 2 ] );
        }
        // rows, cols, matrix
        else {
          rows = getIndices( args[ 0 ], this.shape[ 0 ] );
          cols = getIndices( args[ 1 ], this.shape[ 1 ] );
          mset6( this, rows, cols, args[ 2 ] );
        }
      }
      // 4 input arguments...
      else {
        rows = getIndices( args[ 0 ], this.shape[ 0 ] );
        cols = getIndices( args[ 1 ], this.shape[ 1 ] );
        mset4( this, rows, cols, args[ 2 ], args[ 3 ] );
      }
      return this;
    } // end FUNCTION mset()


// EXPORTS //

    module.exports = mset;

  },{"./mset1.js":55,"./mset2.js":56,"./mset3.js":57,"./mset4.js":58,"./mset5.js":59,"./mset6.js":60}],55:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: mset1( mat, idx, v )
     *	Sets multiple matrix elements to a numeric value `v`.
     *
     * @private
     * @param {Matrix} mat - Matrix instance
     * @param {Number[]} idx - linear indices
     * @param {Number} v - numeric value
     * @returns {Void}
     */
    function mset1( mat, idx, v ) {
      var s0 = mat.strides[ 0 ],
        s1 = mat.strides[ 1 ],
        len = idx.length,
        o = mat.offset,
        sgn,
        r, j, n;

      sgn = ( s0 < 0 ) ? -1 : 1;
      for ( n = 0; n < len; n++ ) {
        j = idx[ n ] % s0;
        r = sgn * ( idx[n] - j );
        mat.data[ o + r + j*s1 ] = v;
      }
    } // end FUNCTION mset1()


// EXPORTS //

    module.exports = mset1;

  },{}],56:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: mset2( mat, idx, clbk, ctx )
     *	Sets multiple matrix elements using a callback function.
     *
     * @private
     * @param {Matrix} mat - Matrix instance
     * @param {Number[]} idx - linear indices
     * @param {Function} clbk - callback function
     * @param {Object} ctx - `this` context when invoking the provided callback
     * @returns {Void}
     */
    function mset2( mat, idx, clbk, ctx ) {
      var s0 = mat.strides[ 0 ],
        s1 = mat.strides[ 1 ],
        len = idx.length,
        o = mat.offset,
        sgn,
        r, c,
        i, k, n;

      sgn = ( s0 < 0 ) ? -1 : 1;
      for ( n = 0; n < len; n++ ) {
        // Get the column number:
        c = idx[ n ] % s0;

        // Determine the row offset:
        i = sgn * ( idx[n] - c );

        // Get the row number:
        r = i / s0;

        // Calculate the index:
        k = o + i + c*s1;

        // Set the value:
        mat.data[ k ] = clbk.call( ctx, mat.data[ k ], r, c, k );
      }
    } // end FUNCTION mset2()


// EXPORTS //

    module.exports = mset2;

  },{}],57:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: mset3( mat, idx, m )
     *	Sets multiple matrix elements using elements from another matrix.
     *
     * @private
     * @param {Matrix} mat - Matrix instance
     * @param {Number[]} idx - linear indices
     * @param {Matrix} m - Matrix instance
     * @returns {Void}
     */
    function mset3( mat, idx, m ) {
      var s0 = mat.strides[ 0 ],
        s1 = mat.strides[ 1 ],
        s2 = m.strides[ 0 ],
        s3 = m.strides[ 1 ],
        len = idx.length,
        o0 = mat.offset,
        o1 = m.offset,
        sgn0, sgn1,
        r0, r1,
        j0, j1,
        n;

      if ( m.length !== len ) {
        throw new Error( 'invalid input argument. Number of indices does not match the number of elements in the value matrix.' );
      }
      sgn0 = ( s0 < 0 ) ? -1 : 1;
      sgn1 = ( s2 < 0 ) ? -1 : 1;
      for ( n = 0; n < len; n++ ) {
        // Get the column number and row offset for the first matrix:
        j0 = idx[ n ] % s0;
        r0 = sgn0 * ( idx[n] - j0 );

        // Get the column number and row offset for the value matrix:
        j1 = n % s2;
        r1 = sgn1 * ( n - j1 );

        mat.data[ o0 + r0 + j0*s1 ] = m.data[ o1 + r1 + j1*s3  ];
      }
    } // end FUNCTION mset3()


// EXPORTS //

    module.exports = mset3;

  },{}],58:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: mset4( mat, rows, cols, clbk, ctx )
     *	Sets multiple matrix elements using a callback function.
     *
     * @private
     * @param {Matrix} mat - Matrix instance
     * @param {Number[]} rows - row indices
     * @param {Number[]} cols - column indices
     * @param {Function} clbk - callback function
     * @param {Object} ctx - `this` context when invoking the provided callback
     * @returns {Void}
     */
    function mset4( mat, rows, cols, clbk, ctx ) {
      var s0 = mat.strides[ 0 ],
        s1 = mat.strides[ 1 ],
        nRows = rows.length,
        nCols = cols.length,
        o = mat.offset,
        r,
        i, j, k;

      for ( i = 0; i < nRows; i++ ) {
        r = o + rows[i]*s0;
        for ( j = 0; j < nCols; j++ ) {
          k = r + cols[j]*s1;
          mat.data[ k ] = clbk.call( ctx, mat.data[ k ], rows[ i ], cols[ j ], k );
        }
      }
    } // end FUNCTION mset4()


// EXPORTS //

    module.exports = mset4;

  },{}],59:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: mset5( mat, rows, cols, v )
     *	Sets multiple matrix elements to a numeric value `v`.
     *
     * @private
     * @param {Matrix} mat - Matrix instance
     * @param {Number[]} rows - row indices
     * @param {Number[]} cols - column indices
     * @param {Number} v - numeric value
     * @returns {Void}
     */
    function mset5( mat, rows, cols, v ) {
      var s0 = mat.strides[ 0 ],
        s1 = mat.strides[ 1 ],
        nRows = rows.length,
        nCols = cols.length,
        o = mat.offset,
        r,
        i, j;

      for ( i = 0; i < nRows; i++ ) {
        r = o + rows[i]*s0;
        for ( j = 0; j < nCols; j++ ) {
          mat.data[ r + cols[j]*s1 ] = v;
        }
      }
    } // end FUNCTION mset5()


// EXPORTS //

    module.exports = mset5;

  },{}],60:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: mset6( mat, rows, cols, m )
     *	Sets multiple matrix elements using elements from another matrix.
     *
     * @private
     * @param {Matrix} mat - Matrix instance
     * @param {Number[]} rows - row indices
     * @param {Number[]} cols - column indices
     * @param {Matrix} m - Matrix instance
     * @returns {Void}
     */
    function mset6( mat, rows, cols, m ) {
      var s0 = mat.strides[ 0 ],
        s1 = mat.strides[ 1 ],
        s2 = m.strides[ 0 ],
        s3 = m.strides[ 1 ],
        nRows = rows.length,
        nCols = cols.length,
        o0 = mat.offset,
        o1 = m.offset,
        r0, r1,
        i, j;

      if ( m.shape[ 0 ] !== nRows || m.shape[ 1 ] !== nCols ) {
        throw new Error( 'invalid input argument. The dimensions given by the row and column indices do not match the value matrix dimensions.' );
      }
      for ( i = 0; i < nRows; i++ ) {
        r0 = o0 + rows[i]*s0;
        r1 = o1 + i*s2;
        for ( j = 0; j < nCols; j++ ) {
          mat.data[ r0 + cols[j]*s1 ] = m.data[ r1 + j*s3 ];
        }
      }
    } // end FUNCTION mset6()


// EXPORTS //

    module.exports = mset6;

  },{}],61:[function(require,module,exports){
    'use strict';

// MODULES //

    var isNonNegativeInteger = require( 'validate.io-nonnegative-integer' ),
      isnan = require( 'validate.io-nan' ),
      isNumber = require( 'validate.io-number-primitive' );


// SET //

    /**
     * FUNCTION: set( i, j, value )
     *	Sets a matrix element based on the provided row and column indices.
     *
     * @param {Number} i - row index
     * @param {Number} j - column index
     * @param {Number} value - value to set
     * @returns {Matrix} Matrix instance
     */
    function set( i, j, v ) {
      /* jshint validthis: true */
      if ( !isNonNegativeInteger( i ) || !isNonNegativeInteger( j ) ) {
        throw new TypeError( 'invalid input argument. Row and column indices must be nonnegative integers. Values: `[' + i + ',' + j + ']`.' );
      }
      if ( !isNumber( v ) && !isnan( v ) ) {
        throw new TypeError( 'invalid input argument. An input value must be a number primitive. Value: `' + v + '`.' );
      }
      i = this.offset + i*this.strides[0] + j*this.strides[1];
      if ( i >= 0 ) {
        this.data[ i ] = v;
      }
      return this;
    } // end FUNCTION set()


// EXPORTS //

    module.exports = set;

  },{"validate.io-nan":104,"validate.io-nonnegative-integer":106,"validate.io-number-primitive":108}],62:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: set( i, j, value )
     *	Sets a matrix element based on the provided row and column indices.
     *
     * @param {Number} i - row index
     * @param {Number} j - column index
     * @param {Number} value - value to set
     * @returns {Matrix} Matrix instance
     */
    function set( i, j, v ) {
      /* jshint validthis: true */
      i = this.offset + i*this.strides[0] + j*this.strides[1];
      if ( i >= 0 ) {
        this.data[ i ] = v;
      }
      return this;
    } // end FUNCTION set()


// EXPORTS //

    module.exports = set;

  },{}],63:[function(require,module,exports){
    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      ispace = require( 'compute-indexspace' );


// VARIABLES //

    var BTYPES = require( './btypes.js' );


// SUBSEQUENCE GET //

    /**
     * FUNCTION: sget( subsequence )
     *	Returns matrix elements according to a specified subsequence.
     *
     * @param {String} subsequence - subsequence string
     * @returns {Matrix} Matrix instance
     */
    function sget( seq ) {
      /*jshint validthis:true */
      var nRows,
        nCols,
        rows,
        cols,
        seqs,
        mat,
        len,
        s0, s1,
        o,
        d,
        r, dr,
        i, j;

      if ( !isString( seq ) ) {
        throw new TypeError( 'invalid input argument. Must provide a string primitive. Value: `' + seq + '`.' );
      }
      seqs = seq.split( ',' );
      if ( seqs.length !== 2 ) {
        throw new Error( 'invalid input argument. Subsequence string must specify row and column subsequences. Value: `' + seq + '`.' );
      }
      rows = ispace( seqs[ 0 ], this.shape[ 0 ] );
      cols = ispace( seqs[ 1 ], this.shape[ 1 ] );

      nRows = rows.length;
      nCols = cols.length;
      len = nRows * nCols;

      d = new BTYPES[ this.dtype ]( len );
      mat = new this.constructor( d, this.dtype, [nRows,nCols], 0, [nCols,1] );

      if ( len ) {
        s0 = this.strides[ 0 ];
        s1 = this.strides[ 1 ];
        o = this.offset;
        for ( i = 0; i < nRows; i++ ) {
          r = o + rows[i]*s0;
          dr = i * nCols;
          for ( j = 0; j < nCols; j++ ) {
            d[ dr + j ] = this.data[ r + cols[j]*s1 ];
          }
        }
      }
      return mat;
    } // end FUNCTION sget()


// EXPORTS //

    module.exports = sget;

  },{"./btypes.js":38,"compute-indexspace":10,"validate.io-string-primitive":112}],64:[function(require,module,exports){
    'use strict';

// MODULES //

    var ispace = require( 'compute-indexspace' );


// VARIABLES //

    var BTYPES = require( './btypes.js' );


// SUBSEQUENCE GET //

    /**
     * FUNCTION: sget( subsequence )
     *	Returns matrix elements according to a specified subsequence.
     *
     * @param {String} subsequence - subsequence string
     * @returns {Matrix} Matrix instance
     */
    function sget( seq ) {
      /*jshint validthis:true */
      var nRows,
        nCols,
        rows,
        cols,
        seqs,
        mat,
        len,
        s0, s1,
        o,
        d,
        r, dr,
        i, j;

      seqs = seq.split( ',' );
      rows = ispace( seqs[ 0 ], this.shape[ 0 ] );
      cols = ispace( seqs[ 1 ], this.shape[ 1 ] );

      nRows = rows.length;
      nCols = cols.length;
      len = nRows * nCols;

      d = new BTYPES[ this.dtype ]( len );
      mat = new this.constructor( d, this.dtype, [nRows,nCols], 0, [nCols,1] );

      if ( len ) {
        s0 = this.strides[ 0 ];
        s1 = this.strides[ 1 ];
        o = this.offset;
        for ( i = 0; i < nRows; i++ ) {
          r = o + rows[i]*s0;
          dr = i * nCols;
          for ( j = 0; j < nCols; j++ ) {
            d[ dr + j ] = this.data[ r + cols[j]*s1 ];
          }
        }
      }
      return mat;
    } // end FUNCTION sget()


// EXPORTS //

    module.exports = sget;

  },{"./btypes.js":38,"compute-indexspace":10}],65:[function(require,module,exports){
    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      isNumber = require( 'validate.io-number-primitive' ),
      isFunction = require( 'validate.io-function' ),
      ispace = require( 'compute-indexspace' );


// SUBSEQUENCE SET //

    /**
     * FUNCTION: sset( subsequence, value[, thisArg] )
     *	Sets matrix elements according to a specified subsequence.
     *
     * @param {String} subsequence - subsequence string
     * @param {Number|Matrix|Function} value - either a single numeric value, a matrix containing the values to set, or a function which returns a numeric value
     * @param {Object} [thisArg] - `this` context when executing a callback
     * @returns {Matrix} Matrix instance
     */
    function sset( seq, val, thisArg ) {
      /* jshint validthis: true */
      var nRows,
        nCols,
        clbk,
        rows,
        cols,
        seqs,
        mat,
        ctx,
        s0, s1, s2, s3,
        o0, o1,
        r0, r1,
        i, j, k;

      if ( !isString( seq ) ) {
        throw new TypeError( 'invalid input argument. Must provide a string primitive. Value: `' + seq + '`.' );
      }
      seqs = seq.split( ',' );
      if ( seqs.length !== 2 ) {
        throw new Error( 'invalid input argument. Subsequence string must specify row and column subsequences. Value: `' + seq + '`.' );
      }
      if ( isFunction( val ) ) {
        clbk = val;
      }
      else if ( !isNumber( val ) ) {
        mat = val;
      }
      rows = ispace( seqs[ 0 ], this.shape[ 0 ] );
      cols = ispace( seqs[ 1 ], this.shape[ 1 ] );

      nRows = rows.length;
      nCols = cols.length;

      if ( !( nRows && nCols ) ) {
        return this;
      }
      s0 = this.strides[ 0 ];
      s1 = this.strides[ 1 ];
      o0 = this.offset;

      // Callback...
      if ( clbk ) {
        if ( arguments.length > 2 ) {
          ctx = thisArg;
        } else {
          ctx = this;
        }
        for ( i = 0; i < nRows; i++ ) {
          r0 = o0 + rows[i]*s0;
          for ( j = 0; j < nCols; j++ ) {
            k = r0 + cols[j]*s1;
            this.data[ k ] = clbk.call( ctx, this.data[ k ], rows[i], cols[j], k );
          }
        }
      }
      // Input matrix...
      else if ( mat ) {
        if ( nRows !== mat.shape[ 0 ] ) {
          throw new Error( 'invalid input arguments. Row subsequence does not match input matrix dimensions. Expected a [' + nRows + ',' + nCols + '] matrix and instead received a [' + mat.shape.join( ',' ) + '] matrix.' );
        }
        if ( nCols !== mat.shape[ 1 ] ) {
          throw new Error( 'invalid input arguments. Column subsequence does not match input matrix dimensions. Expected a [' + nRows + ',' + nCols + '] matrix and instead received a [' + mat.shape.join( ',' ) + '] matrix.' );
        }
        s2 = mat.strides[ 0 ];
        s3 = mat.strides[ 1 ];
        o1 = mat.offset;
        for ( i = 0; i < nRows; i++ ) {
          r0 = o0 + rows[i]*s0;
          r1 = o1 + i*s2;
          for ( j = 0; j < nCols; j++ ) {
            this.data[ r0 + cols[j]*s1 ] = mat.data[ r1 + j*s3 ];
          }
        }
      }
      // Single numeric value...
      else {
        for ( i = 0; i < nRows; i++ ) {
          r0 = o0 + rows[i]*s0;
          for ( j = 0; j < nCols; j++ ) {
            this.data[ r0 + cols[j]*s1 ] = val;
          }
        }
      }
      return this;
    } // end FUNCTION sset()


// EXPORTS //

    module.exports = sset;

  },{"compute-indexspace":10,"validate.io-function":99,"validate.io-number-primitive":108,"validate.io-string-primitive":112}],66:[function(require,module,exports){
    'use strict';

// MODULES //

    var ispace = require( 'compute-indexspace' );


// SUBSEQUENCE SET //

    /**
     * FUNCTION: sset( subsequence, value[, thisArg] )
     *	Sets matrix elements according to a specified subsequence.
     *
     * @param {String} subsequence - subsequence string
     * @param {Number|Matrix|Function} value - either a single numeric value, a matrix containing the values to set, or a function which returns a numeric value
     * @param {Object} [thisArg] - `this` context when executing a callback
     * @returns {Matrix} Matrix instance
     */
    function sset( seq, val, thisArg ) {
      /* jshint validthis: true */
      var nRows,
        nCols,
        clbk,
        rows,
        cols,
        seqs,
        mat,
        ctx,
        s0, s1, s2, s3,
        o0, o1,
        r0, r1,
        i, j, k;

      seqs = seq.split( ',' );
      if ( typeof val === 'function' ) {
        clbk = val;
      }
      else if ( typeof val !== 'number' ) {
        mat = val;
      }
      rows = ispace( seqs[ 0 ], this.shape[ 0 ] );
      cols = ispace( seqs[ 1 ], this.shape[ 1 ] );

      nRows = rows.length;
      nCols = cols.length;

      if ( !( nRows && nCols ) ) {
        return this;
      }
      s0 = this.strides[ 0 ];
      s1 = this.strides[ 1 ];
      o0 = this.offset;

      // Callback...
      if ( clbk ) {
        if ( arguments.length > 2 ) {
          ctx = thisArg;
        } else {
          ctx = this;
        }
        for ( i = 0; i < nRows; i++ ) {
          r0 = o0 + rows[i]*s0;
          for ( j = 0; j < nCols; j++ ) {
            k = r0 + cols[j]*s1;
            this.data[ k ] = clbk.call( ctx, this.data[ k ], rows[i], cols[j], k );
          }
        }
      }
      // Input matrix...
      else if ( mat ) {
        if ( nRows !== mat.shape[ 0 ] ) {
          throw new Error( 'invalid input arguments. Row subsequence does not match input matrix dimensions. Expected a [' + nRows + ',' + nCols + '] matrix and instead received a [' + mat.shape.join( ',' ) + '] matrix.' );
        }
        if ( nCols !== mat.shape[ 1 ] ) {
          throw new Error( 'invalid input arguments. Column subsequence does not match input matrix dimensions. Expected a [' + nRows + ',' + nCols + '] matrix and instead received a [' + mat.shape.join( ',' ) + '] matrix.' );
        }
        s2 = mat.strides[ 0 ];
        s3 = mat.strides[ 1 ];
        o1 = mat.offset;
        for ( i = 0; i < nRows; i++ ) {
          r0 = o0 + rows[i]*s0;
          r1 = o1 + i*s2;
          for ( j = 0; j < nCols; j++ ) {
            this.data[ r0 + cols[j]*s1 ] = mat.data[ r1 + j*s3 ];
          }
        }
      }
      // Single numeric value...
      else {
        for ( i = 0; i < nRows; i++ ) {
          r0 = o0 + rows[i]*s0;
          for ( j = 0; j < nCols; j++ ) {
            this.data[ r0 + cols[j]*s1 ] = val;
          }
        }
      }
      return this;
    } // end FUNCTION sset()


// EXPORTS //

    module.exports = sset;

  },{"compute-indexspace":10}],67:[function(require,module,exports){
    'use strict';

// MODULES //

    var cast = require( 'dstructs-cast-arrays' ),
      copy = require( 'utils-copy' );


// TOJSON //

    /**
     * FUNCTION: toJSON()
     *	Returns a JSON representation of a Matrix.
     *
     * @returns {Object} JSON representation
     */
    function toJSON() {
      /* jshint validthis: true */
      var prop,
        out;

      // Build an object containing all Matrix properties needed to revive a serialized Matrix...
      out = {};
      out.type = 'Matrix';
      out.dtype = this.dtype;
      out.shape = copy( this.shape );
      out.offset = this.offset;
      out.strides = copy( this.strides );

      prop = Object.getOwnPropertyDescriptor( this, 'data' );
      out.raw = prop.writable && prop.configurable && prop.enumerable;

      // Cast data to a generic array:
      out.data = cast( this.data, 'generic' );

      return out;
    } // end FUNCTION toJSON()


// EXPORTS //

    module.exports = toJSON;

  },{"dstructs-cast-arrays":37,"utils-copy":79}],68:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: toString()
     *	Returns a string representation of Matrix elements. Rows are delineated by semicolons. Column values are comma-delimited.
     *
     * @returns {String} string representation
     */
    function toString() {
      /* jshint validthis: true */
      var nRows = this.shape[ 0 ],
        nCols = this.shape[ 1 ],
        s0 = this.strides[ 0 ],
        s1 = this.strides[ 1 ],
        m = nRows - 1,
        n = nCols - 1,
        str = '',
        o,
        i, j;

      for ( i = 0; i < nRows; i++ ) {
        o = this.offset + i*s0;
        for ( j = 0; j < nCols; j++ ) {
          str += this.data[ o + j*s1 ];
          if ( j < n ) {
            str += ',';
          }
        }
        if ( i < m ) {
          str += ';';
        }
      }
      return str;
    } // end FUNCTION toString()


// EXPORTS //

    module.exports = toString;

  },{}],69:[function(require,module,exports){
    'use strict';

// EXPORTS //

    module.exports = Math.exp;

  },{}],70:[function(require,module,exports){
    'use strict';

// EXPORTS //

    module.exports = Math.pow;

  },{}],71:[function(require,module,exports){
    'use strict';

// EXPORTS //

    module.exports = Math.sqrt;

  },{}],72:[function(require,module,exports){
    'use strict';

// modified from https://github.com/es-shims/es5-shim
    var has = Object.prototype.hasOwnProperty;
    var toStr = Object.prototype.toString;
    var slice = Array.prototype.slice;
    var isArgs = require('./isArguments');
    var isEnumerable = Object.prototype.propertyIsEnumerable;
    var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
    var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
    var dontEnums = [
      'toString',
      'toLocaleString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'constructor'
    ];
    var equalsConstructorPrototype = function (o) {
      var ctor = o.constructor;
      return ctor && ctor.prototype === o;
    };
    var excludedKeys = {
      $applicationCache: true,
      $console: true,
      $external: true,
      $frame: true,
      $frameElement: true,
      $frames: true,
      $innerHeight: true,
      $innerWidth: true,
      $outerHeight: true,
      $outerWidth: true,
      $pageXOffset: true,
      $pageYOffset: true,
      $parent: true,
      $scrollLeft: true,
      $scrollTop: true,
      $scrollX: true,
      $scrollY: true,
      $self: true,
      $webkitIndexedDB: true,
      $webkitStorageInfo: true,
      $window: true
    };
    var hasAutomationEqualityBug = (function () {
      /* global window */
      if (typeof window === 'undefined') { return false; }
      for (var k in window) {
        try {
          if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
            try {
              equalsConstructorPrototype(window[k]);
            } catch (e) {
              return true;
            }
          }
        } catch (e) {
          return true;
        }
      }
      return false;
    }());
    var equalsConstructorPrototypeIfNotBuggy = function (o) {
      /* global window */
      if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
        return equalsConstructorPrototype(o);
      }
      try {
        return equalsConstructorPrototype(o);
      } catch (e) {
        return false;
      }
    };

    var keysShim = function keys(object) {
      var isObject = object !== null && typeof object === 'object';
      var isFunction = toStr.call(object) === '[object Function]';
      var isArguments = isArgs(object);
      var isString = isObject && toStr.call(object) === '[object String]';
      var theKeys = [];

      if (!isObject && !isFunction && !isArguments) {
        throw new TypeError('Object.keys called on a non-object');
      }

      var skipProto = hasProtoEnumBug && isFunction;
      if (isString && object.length > 0 && !has.call(object, 0)) {
        for (var i = 0; i < object.length; ++i) {
          theKeys.push(String(i));
        }
      }

      if (isArguments && object.length > 0) {
        for (var j = 0; j < object.length; ++j) {
          theKeys.push(String(j));
        }
      } else {
        for (var name in object) {
          if (!(skipProto && name === 'prototype') && has.call(object, name)) {
            theKeys.push(String(name));
          }
        }
      }

      if (hasDontEnumBug) {
        var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

        for (var k = 0; k < dontEnums.length; ++k) {
          if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
            theKeys.push(dontEnums[k]);
          }
        }
      }
      return theKeys;
    };

    keysShim.shim = function shimObjectKeys() {
      if (Object.keys) {
        var keysWorksWithArguments = (function () {
          // Safari 5.0 bug
          return (Object.keys(arguments) || '').length === 2;
        }(1, 2));
        if (!keysWorksWithArguments) {
          var originalKeys = Object.keys;
          Object.keys = function keys(object) { // eslint-disable-line func-name-matching
            if (isArgs(object)) {
              return originalKeys(slice.call(object));
            } else {
              return originalKeys(object);
            }
          };
        }
      } else {
        Object.keys = keysShim;
      }
      return Object.keys || keysShim;
    };

    module.exports = keysShim;

  },{"./isArguments":73}],73:[function(require,module,exports){
    'use strict';

    var toStr = Object.prototype.toString;

    module.exports = function isArguments(value) {
      var str = toStr.call(value);
      var isArgs = str === '[object Arguments]';
      if (!isArgs) {
        isArgs = str !== '[object Array]' &&
          value !== null &&
          typeof value === 'object' &&
          typeof value.length === 'number' &&
          value.length >= 0 &&
          toStr.call(value.callee) === '[object Function]';
      }
      return isArgs;
    };

  },{}],74:[function(require,module,exports){
    'use strict';

    var re = /^\/((?:\\\/|[^\/])+)\/([imgy]*)$/;
    /*
	Matches parts of a regular expression string.

	/^\/
		-	match a string that begins with a /
	()
		-	capture
	(?:)+
		-	capture, but do not remember, a group of characters which occur 1 or more times
	\\\/
		-	match the literal \/
	|
		-	OR
	[^\/]
		-	anything which is not the literal \/
	\/
		-	match the literal /
	([imgy]*)
		-	capture any characters matching `imgy` occurring 0 or more times
	$/
		-	string end
*/


// EXPORTS //

    module.exports = re;

  },{}],75:[function(require,module,exports){
    /**
     * type-name - Just a reasonable typeof
     *
     * https://github.com/twada/type-name
     *
     * Copyright (c) 2014-2015 Takuto Wada
     * Licensed under the MIT license.
     *   http://twada.mit-license.org/2014-2015
     */
    'use strict';

    var toStr = Object.prototype.toString;

    function funcName (f) {
      return f.name ? f.name : /^\s*function\s*([^\(]*)/im.exec(f.toString())[1];
    }

    function ctorName (obj) {
      var strName = toStr.call(obj).slice(8, -1);
      if (strName === 'Object' && obj.constructor) {
        return funcName(obj.constructor);
      }
      return strName;
    }

    function typeName (val) {
      var type;
      if (val === null) {
        return 'null';
      }
      type = typeof(val);
      if (type === 'object') {
        return ctorName(val);
      }
      return type;
    }

    module.exports = typeName;

  },{}],76:[function(require,module,exports){
    'use strict';

// MODULES //

    var deepCopy = require( 'utils-copy' );
    var getKeys = require( 'object-keys' ).shim();


// COPY ERROR //

    /**
     * FUNCTION: copy( error )
     *	Copies an error.
     *
     * @param {Error|TypeError|SyntaxError|URIError|ReferenceError|RangeError|RangeError|EvalError} error - error to copy
     * @returns {Error|TypeError|SyntaxError|URIError|ReferenceError|RangeError|RangeError|EvalError} error copy
     */
    function copy( error ) {
      /* jshint newcap:false */
      var keys;
      var desc;
      var key;
      var err;
      var i;
      if ( !( error instanceof Error ) ) {
        throw new TypeError( 'invalid input argument. Must provide an error object. Value: `' + error + '`.' );
      }
      // Create a new error...
      err = new error.constructor( error.message );

      // If a `stack` property is present, copy it over...
      if ( error.stack ) {
        err.stack = error.stack;
      }
      // Node.js specific (system errors)...
      if ( error.code ) {
        err.code = error.code;
      }
      if ( error.errno ) {
        err.errno = error.errno;
      }
      if ( error.syscall ) {
        err.syscall = error.syscall;
      }
      // Any enumerable properties...
      keys = getKeys( error );
      for ( i = 0; i < keys.length; i++ ) {
        key = keys[ i ];
        desc = Object.getOwnPropertyDescriptor( error, key );
        if ( desc.hasOwnProperty( 'value' ) ) {
          desc.value = deepCopy( error[ key ] );
        }
        Object.defineProperty( err, key, desc );
      }
      return err;
    } // end FUNCTION copy()


// EXPORTS //

    module.exports = copy;

  },{"object-keys":72,"utils-copy":79}],77:[function(require,module,exports){
    'use strict';

// EXPORTS //

    module.exports = require( './copy.js' );

  },{"./copy.js":76}],78:[function(require,module,exports){
    (function (Buffer){
      'use strict';

// MODULES //

      var isArray = require( 'validate.io-array' );
      var isBuffer = require( 'validate.io-buffer' );
      var typeName = require( 'type-name' );
      var regex = require( 'utils-regex-from-string' );
      var copyError = require( 'utils-copy-error' );
      var indexOf = require( 'utils-indexof' );
      var objectKeys = require( 'object-keys' );
      var typedArrays = require( './typedarrays.js' );


// FUNCTIONS //

      /**
       * FUNCTION: cloneInstance( val )
       *	Clones a class instance.
       *
       *	WARNING: this should only be used for simple cases. Any instances with privileged access to variables (e.g., within closures) cannot be cloned. This approach should be considered fragile.
       *
       *	NOTE: the function is greedy, disregarding the notion of a 'level'. Instead, the function deep copies all properties, as we assume the concept of 'level' applies only to the class instance reference but not to its internal state. This prevents, in theory, two instances from sharing state.
       *
       * @private
       * @param {Object} val - class instance
       * @returns {Object} new instance
       */
      function cloneInstance( val ) {
        var cache = [];
        var refs = [];
        var names;
        var name;
        var desc;
        var tmp;
        var ref;
        var i;

        ref = Object.create( Object.getPrototypeOf( val ) );
        cache.push( val );
        refs.push( ref );

        names = Object.getOwnPropertyNames( val );
        for ( i = 0; i < names.length; i++ ) {
          name = names[ i ];
          desc = Object.getOwnPropertyDescriptor( val, name );
          if ( desc.hasOwnProperty( 'value' ) ) {
            tmp = ( isArray( val[name] ) ) ? [] : {};
            desc.value = deepCopy( val[name], tmp, cache, refs, -1 );
          }
          Object.defineProperty( ref, name, desc );
        }
        if ( !Object.isExtensible( val ) ) {
          Object.preventExtensions( ref );
        }
        if ( Object.isSealed( val ) ) {
          Object.seal( ref );
        }
        if ( Object.isFrozen( val ) ) {
          Object.freeze( ref );
        }
        return ref;
      } // end FUNCTION cloneInstance()


// DEEP COPY //

      /**
       * FUNCTION: deepCopy( val, copy, cache, refs, level )
       *	Recursively performs a deep copy of an input object.
       *
       * @private
       * @param {Array|Object} val - value to copy
       * @param {Array|Object} copy - copy
       * @param {Array} cache - an array of visited objects
       * @param {Array} refs - an array of object references
       * @param {Number} level - copy depth
       * @returns {*} deep copy
       */
      function deepCopy( val, copy, cache, refs, level ) {
        var parent;
        var keys;
        var name;
        var desc;
        var ctor;
        var key;
        var ref;
        var x;
        var i;
        var j;

        level = level - 1;

        // Primitives and functions...
        if (
          typeof val !== 'object' ||
          val === null
        ) {
          return val;
        }
        if ( isBuffer( val ) ) {
          return new Buffer( val );
        }
        if ( val instanceof Error ) {
          return copyError( val );
        }
        // Objects...
        name = typeName( val );

        if ( name === 'Date' ) {
          return new Date( +val );
        }
        if ( name === 'RegExp' ) {
          return regex( val.toString() );
        }
        if ( name === 'Set' ) {
          return new Set( val );
        }
        if ( name === 'Map' ) {
          return new Map( val );
        }
        if (
          name === 'String' ||
          name === 'Boolean' ||
          name === 'Number'
        ) {
          // Return an equivalent primitive!
          return val.valueOf();
        }
        ctor = typedArrays[ name ];
        if ( ctor ) {
          return ctor( val );
        }
        // Class instances...
        if (
          name !== 'Array' &&
          name !== 'Object'
        ) {
          // Cloning requires ES5 or higher...
          if ( typeof Object.freeze === 'function' ) {
            return cloneInstance( val );
          }
          return {};
        }
        // Arrays and plain objects...
        keys = objectKeys( val );
        if ( level > 0 ) {
          parent = name;
          for ( j = 0; j < keys.length; j++ ) {
            key = keys[ j ];
            x = val[ key ];

            // Primitive, Buffer, special class instance...
            name = typeName( x );
            if (
              typeof x !== 'object' ||
              x === null ||
              (
                name !== 'Array' &&
                name !== 'Object'
              ) ||
              isBuffer( x )
            ) {
              if ( parent === 'Object' ) {
                desc = Object.getOwnPropertyDescriptor( val, key );
                if ( desc.hasOwnProperty( 'value' ) ) {
                  desc.value = deepCopy( x );
                }
                Object.defineProperty( copy, key, desc );
              } else {
                copy[ key ] = deepCopy( x );
              }
              continue;
            }
            // Circular reference...
            i = indexOf( cache, x );
            if ( i !== -1 ) {
              copy[ key ] = refs[ i ];
              continue;
            }
            // Plain array or object...
            ref = ( isArray(x) ) ? [] : {};
            cache.push( x );
            refs.push( ref );
            if ( parent === 'Array' ) {
              copy[ key ] = deepCopy( x, ref, cache, refs, level );
            } else {
              desc = Object.getOwnPropertyDescriptor( val, key );
              if ( desc.hasOwnProperty( 'value' ) ) {
                desc.value = deepCopy( x, ref, cache, refs, level );
              }
              Object.defineProperty( copy, key, desc );
            }
          }
        } else {
          if ( name === 'Array' ) {
            for ( j = 0; j < keys.length; j++ ) {
              key = keys[ j ];
              copy[ key ] = val[ key ];
            }
          } else {
            for ( j = 0; j < keys.length; j++ ) {
              key = keys[ j ];
              desc = Object.getOwnPropertyDescriptor( val, key );
              Object.defineProperty( copy, key, desc );
            }
          }
        }
        if ( !Object.isExtensible( val ) ) {
          Object.preventExtensions( copy );
        }
        if ( Object.isSealed( val ) ) {
          Object.seal( copy );
        }
        if ( Object.isFrozen( val ) ) {
          Object.freeze( copy );
        }
        return copy;
      } // end FUNCTION deepCopy()


// EXPORTS //

      module.exports = deepCopy;

    }).call(this,require("buffer").Buffer)
  },{"./typedarrays.js":80,"buffer":2,"object-keys":72,"type-name":81,"utils-copy-error":77,"utils-indexof":92,"utils-regex-from-string":93,"validate.io-array":95,"validate.io-buffer":97}],79:[function(require,module,exports){
    'use strict';

// MODULES //

    var isArray = require( 'validate.io-array' );
    var isNonNegativeInteger = require( 'validate.io-nonnegative-integer' );
    var PINF = require( 'const-pinf-float64' );
    var deepCopy = require( './deepcopy.js' );


// COPY //

    /**
     * FUNCTION: createCopy( value[, level] )
     *	Copy or deep clone a value to an arbitrary depth.
     *
     * @param {*} value - value to be copied
     * @param {Number} [level=+infinity] - option to control copy depth. For example, set to `0` for a shallow copy. Default behavior returns a full deep copy.
     * @returns {*} copy
     */
    function createCopy( val, level ) {
      var copy;
      if ( arguments.length > 1 ) {
        if ( !isNonNegativeInteger( level ) ) {
          throw new TypeError( 'invalid input argument. Level must be a nonnegative integer. Value: `' + level + '`.' );
        }
        if ( level === 0 ) {
          return val;
        }
      } else {
        level = PINF;
      }
      copy = ( isArray(val) ) ? [] : {};
      return deepCopy( val, copy, [val], [copy], level );
    } // end FUNCTION createCopy()


// EXPORTS //

    module.exports = createCopy;

  },{"./deepcopy.js":78,"const-pinf-float64":14,"validate.io-array":95,"validate.io-nonnegative-integer":106}],80:[function(require,module,exports){
    'use strict';

// MODULES //

    var objectKeys = require( 'object-keys' );


// TYPED ARRAY FUNCTIONS //

    /**
     * Create functions for copying typed arrays.
     */
    var typedArrays = {
      'Int8Array': null,
      'Uint8Array': null,
      'Uint8ClampedArray': null,
      'Int16Array': null,
      'Uint16Array': null,
      'Int32Array': null,
      'Uint32Array': null,
      'Float32Array': null,
      'Float64Array': null
    };

    (function createTypedArrayFcns() {
      /* jshint evil:true */
      var keys = objectKeys( typedArrays );
      var len = keys.length;
      var key;
      var i;
      for ( i = 0; i < len; i++ ) {
        key = keys[ i ];
        typedArrays[ key ] = new Function( 'arr', 'return new '+key+'( arr );' );
      }
    })();


// EXPORTS //

    module.exports = typedArrays;

  },{"object-keys":72}],81:[function(require,module,exports){
    /**
     * type-name - Just a reasonable typeof
     *
     * https://github.com/twada/type-name
     *
     * Copyright (c) 2014-2016 Takuto Wada
     * Licensed under the MIT license.
     *   https://github.com/twada/type-name/blob/master/LICENSE
     */
    'use strict';

    var toStr = Object.prototype.toString;

    function funcName (f) {
      if (f.name) {
        return f.name;
      }
      var match = /^\s*function\s*([^\(]*)/im.exec(f.toString());
      return match ? match[1] : '';
    }

    function ctorName (obj) {
      var strName = toStr.call(obj).slice(8, -1);
      if ((strName === 'Object' || strName === 'Error') && obj.constructor) {
        return funcName(obj.constructor);
      }
      return strName;
    }

    function typeName (val) {
      var type;
      if (val === null) {
        return 'null';
      }
      type = typeof val;
      if (type === 'object') {
        return ctorName(val);
      }
      return type;
    }

    module.exports = typeName;

  },{}],82:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: deepGet( obj, props )
     *	Deep get a nested property.
     *
     * @param {Object|Array} obj - input object
     * @param {Array} props - list of properties defining a key path
     * @returns {*} nested property value
     */
    function deepGet( obj, props ) {
      var len = props.length,
        v = obj,
        i;

      for ( i = 0; i < len; i++ ) {
        if ( typeof v === 'object' && v !== null && v.hasOwnProperty( props[i] ) ) {
          v = v[ props[i] ];
        } else {
          return;
        }
      }
      return v;
    } // end FUNCTION deepGet()


// EXPORTS //

    module.exports = deepGet;

  },{}],83:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: defaults()
     *	Returns default options.
     *
     * @returns {Object} default options
     */
    function defaults() {
      return {
        'sep': '.'
      };
    } // end FUNCTION defaults()


// EXPORTS //

    module.exports = defaults;

  },{}],84:[function(require,module,exports){
    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      isArray = require( 'validate.io-array' ),
      validate = require( './validate.js' ),
      defaults = require( './defaults.js' ),
      dget = require( './deepget.js' );


// FACTORY //

    /**
     * FUNCTION: factory( path[, opts] )
     *	Creates a reusable deep get factory.
     *
     * @param {String|Array} path - key path
     * @param {Object} [opts] - function options
     * @param {String} [opts.sep='.'] - key path separator
     * @returns {Function} deep get factory
     */
    function factory( path, options ) {
      var isStr = isString( path ),
        props,
        opts,
        err;
      if ( !isStr && !isArray( path ) ) {
        throw new TypeError( 'deepGet()::invalid input argument. Key path must be a string primitive or a key array. Value: `' + path + '`.' );
      }
      opts = defaults();
      if ( arguments.length > 1 ) {
        err = validate( opts, options );
        if ( err ) {
          throw err;
        }
      }
      if ( isStr ) {
        props = path.split( opts.sep );
      } else {
        props = path;
      }
      /**
       * FUNCTION: deepGet( obj )
       *	Deep get a nested property.
       *
       * @param {Object|Array} obj - input object
       * @returns {*} nested property value
       */
      return function deepGet( obj ) {
        if ( typeof obj !== 'object' || obj === null ) {
          return;
        }
        return dget( obj, props );
      };
    } // end FUNCTION factory()


// EXPORTS //

    module.exports = factory;

  },{"./deepget.js":82,"./defaults.js":83,"./validate.js":86,"validate.io-array":95,"validate.io-string-primitive":112}],85:[function(require,module,exports){
    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      isArray = require( 'validate.io-array' ),
      validate = require( './validate.js' ),
      defaults = require( './defaults.js' ),
      dget = require( './deepget.js' );


// DEEP GET //

    /**
     * FUNCTION: deepGet( obj, path[, opts] )
     *	Deep get a nested property.
     *
     * @param {Object|Array} obj - input object
     * @param {String|Array} path - key path
     * @param {Object} [opts] - function options
     * @param {String} [opts.sep='.'] - key path separator
     * @returns {*} nested property value
     */
    function deepGet( obj, path, options ) {
      var isStr = isString( path ),
        props,
        opts,
        err;
      if ( typeof obj !== 'object' || obj === null ) {
        return;
      }
      if ( !isStr && !isArray( path ) ) {
        throw new TypeError( 'deepGet()::invalid input argument. Key path must be a string primitive or a key array. Value: `' + path + '`.' );
      }
      opts = defaults();
      if ( arguments.length > 2 ) {
        err = validate( opts, options );
        if ( err ) {
          throw err;
        }
      }
      if ( isStr ) {
        props = path.split( opts.sep );
      } else {
        props = path;
      }
      return dget( obj, props );
    } // end FUNCTION deepGet()


// EXPORTS //

    module.exports = deepGet;
    module.exports.factory = require( './factory.js' );

  },{"./deepget.js":82,"./defaults.js":83,"./factory.js":84,"./validate.js":86,"validate.io-array":95,"validate.io-string-primitive":112}],86:[function(require,module,exports){
    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      isObject = require( 'validate.io-object' );


// VALIDATE //

    /**
     * FUNCTION: validate( opts, options )
     *	Validates function options.
     *
     * @param {Object} opts - destination for function options
     * @param {Object} options - function options
     * @param {String} [options.sep] - key path separator
     * @returns {Error|Null} error or null
     */
    function validate( opts, options ) {
      if ( !isObject( options ) ) {
        return new TypeError( 'deepGet()::invalid input argument. Options argument must be an object. Value: `' + options + '`.' );
      }
      if ( options.hasOwnProperty( 'sep' ) ) {
        opts.sep = options.sep;
        if ( !isString( opts.sep ) ) {
          return new TypeError( 'deepGet()::invalid option. Key path separator must be a string primitive. Option: `' + opts.sep + '`.' );
        }
      }
      return null;
    } // end FUNCTION validate()


// EXPORTS //

    module.exports = validate;

  },{"validate.io-object":110,"validate.io-string-primitive":112}],87:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: deepSet( obj, props, create, value )
     *	Deep sets a nested property.
     *
     * @param {Object|Array} obj - input object
     * @param {Array} props - list of properties defining a key path
     * @param {Boolean} create - boolean indicating whether to create a path if the key path does not already exist
     * @param {*} value - value to set
     * @returns {Boolean} boolean indicating if the property was successfully set
     */
    function deepSet( obj, props, create, val ) {
      var len = props.length,
        bool = false,
        v = obj,
        p,
        i;

      for ( i = 0; i < len; i++ ) {
        p = props[ i ];
        if ( typeof v === 'object' && v !== null ) {
          if ( !v.hasOwnProperty( p ) ) {
            if ( create ) {
              v[ p ] = {};
            } else {
              break;
            }
          }
          if ( i === len-1 ) {
            if ( typeof val === 'function' ) {
              v[ p ] = val( v[ p ] );
            } else {
              v[ p ] = val;
            }
            bool = true;
          } else {
            v = v[ p ];
          }
        } else {
          break;
        }
      }
      return bool;
    } // end FUNCTION deepSet()


// EXPORTS //

    module.exports = deepSet;

  },{}],88:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: defaults()
     *	Returns default options.
     *
     * @returns {Object} default options
     */
    function defaults() {
      return {
        'create': false,
        'sep': '.'
      };
    } // end FUNCTION defaults()


// EXPORTS //

    module.exports = defaults;

  },{}],89:[function(require,module,exports){
    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      isArray = require( 'validate.io-array' ),
      validate = require( './validate.js' ),
      defaults = require( './defaults.js' ),
      dset = require( './deepset.js' );


// FACTORY //

    /**
     * FUNCTION: factory( path[, opts] )
     *	Creates a reusable deep set factory.
     *
     * @param {String|Array} path - key path
     * @param {Object} [opts] - function options
     * @param {Boolean} [opts.create=false] - boolean indicating whether to create a path if the key path does not already exist
     * @param {String} [opts.sep='.'] - key path separator
     * @returns {Function} deep set factory
     */
    function factory( path, options ) {
      var isStr = isString( path ),
        props,
        opts,
        err;
      if ( !isStr && !isArray( path ) ) {
        throw new TypeError( 'deepSet()::invalid input argument. Key path must be a string primitive or a key array. Value: `' + path + '`.' );
      }
      opts = defaults();
      if ( arguments.length > 1 ) {
        err = validate( opts, options );
        if ( err ) {
          throw err;
        }
      }
      if ( isStr ) {
        props = path.split( opts.sep );
      } else {
        props = path;
      }
      /**
       * FUNCTION: deepSet( obj, value )
       *	Deep sets a nested property.
       *
       * @param {Object|Array} obj - input object
       * @param {*} value - value to set
       * @returns {Boolean} boolean indicating if the property was successfully set
       */
      return function deepSet( obj, value ) {
        if ( typeof obj !== 'object' || obj === null ) {
          return false;
        }
        return dset( obj, props, opts.create, value );
      };
    } // end FUNCTION factory()


// EXPORTS //

    module.exports = factory;

  },{"./deepset.js":87,"./defaults.js":88,"./validate.js":91,"validate.io-array":95,"validate.io-string-primitive":112}],90:[function(require,module,exports){
    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      isArray = require( 'validate.io-array' ),
      validate = require( './validate.js' ),
      defaults = require( './defaults.js' ),
      dset = require( './deepset.js' );


// DEEP SET //

    /**
     * FUNCTION: deepSet( obj, path, value[, opts] )
     *	Deep sets a nested property.
     *
     * @param {Object|Array} obj - input object
     * @param {String|Array} path - key path
     * @param {*} value - value to set
     * @param {Object} [opts] - function options
     * @param {Boolean} [opts.create=false] - boolean indicating whether to create a path if the key path does not already exist
     * @param {String} [opts.sep='.'] - key path separator
     * @returns {Boolean} boolean indicating if the property was successfully set
     */
    function deepSet( obj, path, value, options ) {
      var isStr = isString( path ),
        props,
        opts,
        err;
      if ( typeof obj !== 'object' || obj === null ) {
        return false;
      }
      if ( !isStr && !isArray( path ) ) {
        throw new TypeError( 'deepSet()::invalid input argument. Key path must be a string primitive or a key array. Value: `' + path + '`.' );
      }
      opts = defaults();
      if ( arguments.length > 3 ) {
        err = validate( opts, options );
        if ( err ) {
          throw err;
        }
      }
      if ( isStr ) {
        props = path.split( opts.sep );
      } else {
        props = path;
      }
      return dset( obj, props, opts.create, value );
    } // end FUNCTION deepSet()


// EXPORTS //

    module.exports = deepSet;
    module.exports.factory = require( './factory.js' );

  },{"./deepset.js":87,"./defaults.js":88,"./factory.js":89,"./validate.js":91,"validate.io-array":95,"validate.io-string-primitive":112}],91:[function(require,module,exports){
    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      isObject = require( 'validate.io-object' ),
      isBoolean = require( 'validate.io-boolean-primitive' );


// VALIDATE //

    /**
     * FUNCTION: validate( opts, options )
     *	Validates function options.
     *
     * @param {Object} opts - destination for function options
     * @param {Object} options - function options
     * @param {Boolean} [options.create] - boolean indicating whether to create a path if the key path does not already exist
     * @param {String} [options.sep] - key path separator
     * @returns {Error|Null} error or null
     */
    function validate( opts, options ) {
      if ( !isObject( options ) ) {
        return new TypeError( 'deepSet()::invalid input argument. Options argument must be an object. Value: `' + options + '`.' );
      }
      if ( options.hasOwnProperty( 'create' ) ) {
        opts.create = options.create;
        if ( !isBoolean( opts.create ) ) {
          return new TypeError( 'deepSet()::invalid option. Create option must be a boolean primitive. Option: `' + opts.create + '`.' );
        }
      }
      if ( options.hasOwnProperty( 'sep' ) ) {
        opts.sep = options.sep;
        if ( !isString( opts.sep ) ) {
          return new TypeError( 'deepSet()::invalid option. Key path separator must be a string primitive. Option: `' + opts.sep + '`.' );
        }
      }
      return null;
    } // end FUNCTION validate()


// EXPORTS //

    module.exports = validate;

  },{"validate.io-boolean-primitive":96,"validate.io-object":110,"validate.io-string-primitive":112}],92:[function(require,module,exports){
    'use strict';

// MODULES //

    var isArrayLike = require( 'validate.io-array-like' );
    var isInteger = require( 'validate.io-integer-primitive' );


// INDEXOF //

    /**
     * FUNCTION: indexOf( arr, searchElement[, fromIndex] )
     *	Returns the first index at which a given element can be found.
     *
     * @param {Array|String|Object} arr - array-like object
     * @param {*} searchElement - element to find
     * @param {Number} [fromIndex] - starting index (if negative, the start index is determined relative to last element)
     * @returns {Number} index or -1
     */
    function indexOf( arr, searchElement, fromIndex ) {
      var len;
      var i;
      if ( !isArrayLike( arr ) ) {
        throw new TypeError( 'invalid input argument. First argument must be an array-like object. Value: `' + arr + '`.' );
      }
      len = arr.length;
      if ( len === 0 ) {
        return -1;
      }
      if ( arguments.length === 3 ) {
        if ( !isInteger( fromIndex ) ) {
          throw new TypeError( 'invalid input argument. `fromIndex` must be an integer. Value: `' + fromIndex + '`.' );
        }
        if ( fromIndex >= 0 ) {
          if ( fromIndex >= len ) {
            return -1;
          }
          i = fromIndex;
        } else {
          i = len + fromIndex;
          if ( i < 0 ) {
            i = 0;
          }
        }
      } else {
        i = 0;
      }
      if ( searchElement !== searchElement ) { // check for NaN
        for ( ; i < len; i++ ) {
          if ( arr[ i ] !== arr[ i ] ) {
            return i;
          }
        }
      } else {
        for ( ; i < len; i++ ) {
          if ( arr[ i ] === searchElement ) {
            return i;
          }
        }
      }
      return -1;
    } // end FUNCTION indexOf()


// EXPORTS //

    module.exports = indexOf;

  },{"validate.io-array-like":94,"validate.io-integer-primitive":100}],93:[function(require,module,exports){
    'use strict';

// MODULES //

    var isString = require( 'validate.io-string-primitive' ),
      RE = require( 'regex-regex' );


// REGEX //

    /**
     * FUNCTION: regex( str )
     *	Parses a regular expression string and returns a new regular expression.
     *
     * @param {String} str - regular expression string
     * @returns {RegExp|Null} regular expression or null
     */
    function regex( str ) {
      if ( !isString( str ) ) {
        throw new TypeError( 'invalid input argument. Must provide a regular expression string. Value: `' + str + '`.' );
      }
      // Capture the regular expression pattern and any flags:
      str = RE.exec( str );

      // Create a new regular expression:
      return ( str ) ? new RegExp( str[1], str[2] ) : null;
    } // end FUNCTION regex()


// EXPORTS //

    module.exports = regex;

  },{"regex-regex":74,"validate.io-string-primitive":112}],94:[function(require,module,exports){
    'use strict';

// MODULES //

    var isInteger = require( 'validate.io-integer-primitive' );


// CONSTANTS //

    var MAX = require( 'const-max-uint32' );


// IS ARRAY-LIKE //

    /**
     * FUNCTION: isArrayLike( value )
     *	Validates if a value is array-like.
     *
     * @param {*} value - value to validate
     * @param {Boolean} boolean indicating if a value is array-like
     */
    function isArrayLike( value ) {
      return (
        value !== void 0 &&
        value !== null &&
        typeof value !== 'function' &&
        isInteger( value.length ) &&
        value.length >= 0 &&
        value.length <= MAX
      );
    } // end FUNCTION isArrayLike()


// EXPORTS //

    module.exports = isArrayLike;

  },{"const-max-uint32":11,"validate.io-integer-primitive":100}],95:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: isArray( value )
     *	Validates if a value is an array.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating whether value is an array
     */
    function isArray( value ) {
      return Object.prototype.toString.call( value ) === '[object Array]';
    } // end FUNCTION isArray()

// EXPORTS //

    module.exports = Array.isArray || isArray;

  },{}],96:[function(require,module,exports){
    /**
     *
     *	VALIDATE: boolean-primitive
     *
     *
     *	DESCRIPTION:
     *		- Validates if a value is a boolean primitive.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2015. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2015.
     *
     */

    'use strict';

    /**
     * FUNCTION: isBoolean( value )
     *	Validates if a value is a boolean primitive.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating if a value is a boolean primitive
     */
    function isBoolean( value ) {
      return value === true || value === false;
    } // end FUNCTION isBoolean()


// EXPORTS //

    module.exports = isBoolean;

  },{}],97:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: isBuffer( value )
     *	Validates if a value is a Buffer object.
     *
     * @param {*} value - value to validate
     * @returns {Boolean} boolean indicating if a value is a Buffer object
     */
    function isBuffer( val ) {
      return typeof val === 'object' &&
        val !== null &&
        (
          val._isBuffer || // for envs missing Object.prototype.constructor (e.g., Safari 5-7)
          (
            val.constructor &&
            typeof val.constructor.isBuffer === 'function' &&
            val.constructor.isBuffer( val )
          )
        );
    } // end FUNCTION isBuffer()


// EXPORTS //

    module.exports = isBuffer;

  },{}],98:[function(require,module,exports){
    /**
     *
     *	VALIDATE: contains
     *
     *
     *	DESCRIPTION:
     *		- Validates if an array contains an input value.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2015. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2015.
     *
     */

    'use strict';

// MODULES //

    var isArray = require( 'validate.io-array' ),
      isnan = require( 'validate.io-nan-primitive' );


// CONTAINS //

    /**
     * FUNCTION: contains( arr, value )
     *	Validates if an array contains an input value.
     *
     * @param {Array} arr - search array
     * @param {*} value - search value
     * @returns {Boolean} boolean indicating if an array contains an input value
     */
    function contains( arr, value ) {
      var len, i;
      if ( !isArray( arr ) ) {
        throw new TypeError( 'contains()::invalid input argument. First argument must be an array. Value: `' + arr + '`.' );
      }
      len = arr.length;
      if ( isnan( value ) ) {
        for ( i = 0; i < len; i++ ) {
          if ( isnan( arr[ i ] ) ) {
            return true;
          }
        }
        return false;
      }
      for ( i = 0; i < len; i++ ) {
        if ( arr[ i ] === value ) {
          return true;
        }
      }
      return false;
    } // end FUNCTION contains()


// EXPORTS //

    module.exports = contains;

  },{"validate.io-array":95,"validate.io-nan-primitive":103}],99:[function(require,module,exports){
    /**
     *
     *	VALIDATE: function
     *
     *
     *	DESCRIPTION:
     *		- Validates if a value is a function.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2014. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2014.
     *
     */

    'use strict';

    /**
     * FUNCTION: isFunction( value )
     *	Validates if a value is a function.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating whether value is a function
     */
    function isFunction( value ) {
      return ( typeof value === 'function' );
    } // end FUNCTION isFunction()


// EXPORTS //

    module.exports = isFunction;

  },{}],100:[function(require,module,exports){
    'use strict';

// MODULES //

    var isNumber = require( 'validate.io-number-primitive' );


// IS INTEGER //

    /**
     * FUNCTION: isInteger( value )
     *	Validates if a value is a number primitive, excluding `NaN`, and an integer.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating if a value is a integer primitive
     */
    function isInteger( value ) {
      return isNumber( value ) && value%1 === 0;
    } // end FUNCTION isInteger()


// EXPORTS //

    module.exports = isInteger;

  },{"validate.io-number-primitive":108}],101:[function(require,module,exports){
    /**
     *
     *	VALIDATE: integer
     *
     *
     *	DESCRIPTION:
     *		- Validates if a value is an integer.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2014. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2014.
     *
     */

    'use strict';

// MODULES //

    var isNumber = require( 'validate.io-number' );


// ISINTEGER //

    /**
     * FUNCTION: isInteger( value )
     *	Validates if a value is an integer.
     *
     * @param {Number} value - value to be validated
     * @returns {Boolean} boolean indicating whether value is an integer
     */
    function isInteger( value ) {
      return isNumber( value ) && value%1 === 0;
    } // end FUNCTION isInteger()


// EXPORTS //

    module.exports = isInteger;

  },{"validate.io-number":109}],102:[function(require,module,exports){
    'use strict';

    /**
     * FUNCTION: matrixLike( value )
     *	Validates if a value is matrix-like.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating if a value is matrix-like
     */
    function matrixLike( v ) {
      return v !== null &&
        typeof v === 'object' &&
        typeof v.data === 'object' &&
        typeof v.shape === 'object' &&
        typeof v.offset === 'number' &&
        typeof v.strides === 'object' &&
        typeof v.dtype === 'string' &&
        typeof v.length === 'number';
    } // end FUNCTION matrixLike()


// EXPORTS //

    module.exports = matrixLike;

  },{}],103:[function(require,module,exports){
    /**
     *
     *	VALIDATE: nan-primitive
     *
     *
     *	DESCRIPTION:
     *		- Validates if a value is a NaN primitive.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2015. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2015.
     *
     */

    'use strict';

    /**
     * FUNCTION: nan( value )
     *	Validates if a value is a NaN primitive.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating whether the value is a NaN primitive
     */
    function nan( value ) {
      return typeof value === 'number' && value !== value;
    } // end FUNCTION nan()


// EXPORTS //

    module.exports = nan;

  },{}],104:[function(require,module,exports){
    /**
     *
     *	VALIDATE: nan
     *
     *
     *	DESCRIPTION:
     *		- Validates if a value is NaN.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2014. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2014.
     *
     */

    'use strict';

    /**
     * FUNCTION: nan( value )
     *	Validates if a value is not-a-number.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating whether the value is a NaN
     */
    function nan( value ) {
      return ( typeof value === 'number' || Object.prototype.toString.call( value ) === '[object Number]' ) && value.valueOf() !== value.valueOf();
    } // end FUNCTION nan()


// EXPORTS //

    module.exports = nan;

  },{}],105:[function(require,module,exports){
    /**
     *
     *	VALIDATE: nonnegative-integer-array
     *
     *
     *	DESCRIPTION:
     *		- Validates if a value is a nonnegative integer array.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2015. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2015.
     *
     */

    'use strict';

// MODULES //

    var isArray = require( 'validate.io-array' ),
      isNonNegativeInteger = require( 'validate.io-nonnegative-integer' );


// IS NONNEGATIVE INTEGER ARRAY //

    /**
     * FUNCTION: isNonNegativeIntegerArray( value )
     *	Validates if a value is a nonnegative integer array.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating if a value is a nonnegative integer array
     */
    function isNonNegativeIntegerArray( value ) {
      var len;
      if ( !isArray( value ) ) {
        return false;
      }
      len = value.length;
      if ( !len ) {
        return false;
      }
      for ( var i = 0; i < len; i++ ) {
        if ( !isNonNegativeInteger( value[i] ) ) {
          return false;
        }
      }
      return true;
    } // end FUNCTION isNonNegativeIntegerArray()


// EXPORTS //

    module.exports = isNonNegativeIntegerArray;

  },{"validate.io-array":95,"validate.io-nonnegative-integer":106}],106:[function(require,module,exports){
    /**
     *
     *	VALIDATE: nonnegative-integer
     *
     *
     *	DESCRIPTION:
     *		- Validates if a value is a nonnegative integer.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2015. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2015.
     *
     */

    'use strict';

// MODULES //

    var isInteger = require( 'validate.io-integer' );


// IS NONNEGATIVE INTEGER //

    /**
     * FUNCTION: isNonNegativeInteger( value )
     *	Validates if a value is a nonnegative integer.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating if a value is a nonnegative integer
     */
    function isNonNegativeInteger( value ) {
      return isInteger( value ) && value >= 0;
    } // end FUNCTION isNonNegativeInteger()


// EXPORTS //

    module.exports = isNonNegativeInteger;

  },{"validate.io-integer":101}],107:[function(require,module,exports){
    /**
     *
     *	VALIDATE: nonnegative
     *
     *
     *	DESCRIPTION:
     *		- Validates if a value is a nonnegative number.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2015. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2015.
     *
     */

    'use strict';

// MODULES //

    var isNumber = require( 'validate.io-number' );


// IS NONNEGATIVE //

    /**
     * FUNCTION: isNonNegative( value )
     *	Validates if a value is a nonnegative number.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating if a value is a nonnegative number
     */
    function isNonNegative( value ) {
      return isNumber( value ) && value >= 0;
    } // end FUNCTION isNonNegative()


// EXPORTS //

    module.exports = isNonNegative;

  },{"validate.io-number":109}],108:[function(require,module,exports){
    /**
     *
     *	VALIDATE: number-primitive
     *
     *
     *	DESCRIPTION:
     *		- Validates if a value is a number primitive.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2015. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2015.
     *
     */

    'use strict';

    /**
     * FUNCTION: isNumber( value )
     *	Validates if a value is a number primitive, excluding `NaN`.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating if a value is a number primitive
     */
    function isNumber( value ) {
      return (typeof value === 'number') && (value === value);
    } // end FUNCTION isNumber()


// EXPORTS //

    module.exports = isNumber;

  },{}],109:[function(require,module,exports){
    /**
     *
     *	VALIDATE: number
     *
     *
     *	DESCRIPTION:
     *		- Validates if a value is a number.
     *
     *
     *	NOTES:
     *		[1]
     *
     *
     *	TODO:
     *		[1]
     *
     *
     *	LICENSE:
     *		MIT
     *
     *	Copyright (c) 2014. Athan Reines.
     *
     *
     *	AUTHOR:
     *		Athan Reines. kgryte@gmail.com. 2014.
     *
     */

    'use strict';

    /**
     * FUNCTION: isNumber( value )
     *	Validates if a value is a number.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating whether value is a number
     */
    function isNumber( value ) {
      return ( typeof value === 'number' || Object.prototype.toString.call( value ) === '[object Number]' ) && value.valueOf() === value.valueOf();
    } // end FUNCTION isNumber()


// EXPORTS //

    module.exports = isNumber;

  },{}],110:[function(require,module,exports){
    'use strict';

// MODULES //

    var isArray = require( 'validate.io-array' );


// ISOBJECT //

    /**
     * FUNCTION: isObject( value )
     *	Validates if a value is a object; e.g., {}.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating whether value is a object
     */
    function isObject( value ) {
      return ( typeof value === 'object' && value !== null && !isArray( value ) );
    } // end FUNCTION isObject()


// EXPORTS //

    module.exports = isObject;

  },{"validate.io-array":95}],111:[function(require,module,exports){
    'use strict';

// MODULES //

    var isNumber = require( 'validate.io-number-primitive' );


// IS POSITIVE //

    /**
     * FUNCTION: isPositive( value )
     *	Validates if a value is a positive number primitive.
     *
     * @param {*} value - value to be validated
     * @returns {Boolean} boolean indicating if a value is a positive number primitive
     */
    function isPositive( value ) {
      return isNumber( value ) && value > 0;
    } // end FUNCTION isPositive()


// EXPORTS //

    module.exports = isPositive;

  },{"validate.io-number-primitive":108}],112:[function(require,module,exports){
    'use strict';

    /**
     * Tests if a value is a string primitive.
     *
     * @param {*} value - value to test
     * @returns {Boolean} boolean indicating if a value is a string primitive
     */
    function isString( value ) {
      return typeof value === 'string';
    } // end FUNCTION isString()


// EXPORTS //

    module.exports = isString;

  },{}],113:[function(require,module,exports){
    'use strict';

// MODULES //

    var isInteger = require( 'validate.io-integer-primitive' );


// CONSTANTS //

    var MAX = require( 'const-max-uint32' );


// IS TYPED-ARRAY-LIKE //

    /**
     * FUNCTION: isTypedArrayLike( value )
     *	Validates if a value is typed-array-like.
     *
     * @param {*} value - value to validate
     * @param {Boolean} boolean indicating if a value is typed-array-like
     */
    function isTypedArrayLike( value ) {
      return (
        value !== null &&
        typeof value === 'object' &&
        isInteger( value.length ) &&
        value.length >= 0 &&
        value.length <= MAX &&
        typeof value.BYTES_PER_ELEMENT === 'number' &&
        typeof value.byteOffset === 'number' &&
        typeof value.byteLength === 'number'
      );
    } // end FUNCTION isTypedArrayLike()


// EXPORTS //

    module.exports = isTypedArrayLike;

  },{"const-max-uint32":11,"validate.io-integer-primitive":100}],114:[function(require,module,exports){
    pdf = require("distributions-truncated-normal-pdf");

  },{"distributions-truncated-normal-pdf":27}]},{},[114]);
