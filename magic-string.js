(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['vlq'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory(require('vlq'));
	} else {
		// browser global
		global.MagicString = factory(global.vlq);
	}

}(typeof window !== 'undefined' ? window : this, function (vlq__default) {

	'use strict';

	var btoa___btoa;
	
	if ( typeof window !== 'undefined' && typeof window.btoa === 'function' ) {
		btoa___btoa = window.btoa;
	} else if ( typeof Buffer === 'function' ) {
		btoa___btoa = function ( str ) {
			return new Buffer( str ).toString( 'base64' );
		};
	} else {
		throw new Error( 'Unsupported environment' );
	}
	
	var btoa__default = btoa___btoa;

	var SourceMap__SourceMap = function ( properties ) {
		this.version = 3;
	
		this.file           = properties.file;
		this.sources        = properties.sources;
		this.sourcesContent = properties.sourcesContent;
		this.names          = properties.names;
		this.mappings       = properties.mappings;
	};
	
	SourceMap__SourceMap.prototype = {
		toString: function () {
			return JSON.stringify( this );
		},
	
		toUrl: function () {
			return 'data:application/json;charset=utf-8;base64,' + btoa__default( this.toString() );
		}
	};
	
	var SourceMap__default = SourceMap__SourceMap;

	function getRelativePath__getRelativePath ( from, to ) {
		var fromParts, toParts, i;
	
		fromParts = from.split( '/' );
		toParts = to.split( '/' );
	
		fromParts.pop(); // get dirname
	
		while ( fromParts[0] === toParts[0] ) {
			fromParts.shift();
			toParts.shift();
		}
	
		if ( fromParts.length ) {
			i = fromParts.length;
			while ( i-- ) fromParts[i] = '..';
		}
	
		return fromParts.concat( toParts ).join( '/' );
		// } else {
		// 	toParts.unshift( '.' );
		// 	return toParts.join( '/' );
		// }
	}
	var getRelativePath__default = getRelativePath__getRelativePath;

	var Bundle__Bundle = function ( options ) {
		options = options || {};
	
		this.intro = options.intro || '';
		this.outro = options.outro || '';
		this.separator = 'separator' in options ? options.separator : '\n';
	
		this.sources = [];
	};
	
	Bundle__Bundle.prototype = {
		addSource: function ( source ) {
			if ( typeof source !== 'object' || !source.content ) {
				throw new Error( 'bundle.addSource() takes an object with a `content` property, which should be an instance of MagicString, and an optional `filename`' );
			}
	
			this.sources.push( source );
			return this;
		},
	
		append: function ( str ) {
			this.outro += str;
			return this;
		},
	
		clone: function () {
			var bundle = new Bundle__Bundle({
				intro: this.intro,
				outro: this.outro,
				separator: this.separator
			});
	
			this.sources.forEach( function ( source ) {
				bundle.addSource({
					filename: source.filename,
					content: source.content.clone()
				});
			});
	
			return bundle;
		},
	
		generateMap: function ( options ) {
			var offsets = {}, encoded, encodingSeparator;
	
			encodingSeparator = Bundle__getSemis( this.separator );
	
			encoded = (
				Bundle__getSemis( this.intro ) +
				this.sources.map( function ( source, sourceIndex) {
					return source.content.getMappings( options.hires, sourceIndex, offsets );
				}).join( encodingSeparator ) +
				Bundle__getSemis( this.outro )
			);
	
			return new SourceMap__default({
				file: options.file.split( '/' ).pop(),
				sources: this.sources.map( function ( source ) {
					return getRelativePath__default( options.file, source.filename );
				}),
				sourcesContent: this.sources.map( function ( source ) {
					return options.includeContent ? source.content.original : null;
				}),
				names: [],
				mappings: encoded
			});
		},
	
		getIndentString: function () {
			var indentStringCounts = {};
	
			this.sources.forEach( function ( source ) {
				var indentStr = source.content.indentStr;
	
				if ( !indentStringCounts[ indentStr ] ) indentStringCounts[ indentStr ] = 0;
				indentStringCounts[ indentStr ] += 1;
			});
	
			return ( Object.keys( indentStringCounts ).sort( function ( a, b ) {
				return indentStringCounts[a] - indentStringCounts[b];
			})[0] ) || '\t';
		},
	
		indent: function ( indentStr ) {
			if ( !indentStr ) {
				indentStr = this.getIndentString();
			}
	
			this.sources.forEach( function ( source ) {
				source.content.indent( indentStr );
			});
	
			this.intro = ( this.intro ? indentStr : '' ) + this.intro.replace( /\n(.+)/g, ( '\n' + indentStr + '$1' ) );
			this.outro = this.outro.replace( /\n(.+)/g, ( '\n' + indentStr + '$1' ) );
	
			return this;
		},
	
		prepend: function ( str ) {
			this.intro = str + this.intro;
			return this;
		},
	
		toString: function () {
			return this.intro + this.sources.map( Bundle__stringify ).join( this.separator ) + this.outro;
		},
	
		trim: function () {
			var i, source;
	
			this.intro = this.intro.replace( /^\s+/, '' );
			this.outro = this.outro.replace( /\s+$/, '' );
	
			// trim start
			if ( !this.intro ) {
				i = 0;
				do {
					source = this.sources[i];
	
					if ( !source ) {
						this.outro = this.outro.replace( /^\s+/, '' );
						break;
					}
	
					source.content.trimStart();
					i += 1;
				} while ( source.content.str === '' );
			}
	
			// trim end
			if ( !this.outro ) {
				i = this.sources.length - 1;
				do {
					source = this.sources[i];
	
					if ( !source ) {
						this.intro = this.intro.replace( /\s+$/, '' );
						break;
					}
	
					source.content.trimEnd();
					i -= 1;
				} while ( source.content.str === '' );
			}
	
			return this;
		}
	};
	
	var Bundle__default = Bundle__Bundle;
	
	function Bundle__stringify ( source ) {
		return source.content.toString();
	}
	
	function Bundle__getSemis ( str ) {
		return new Array( str.split( '\n' ).length ).join( ';' );
	}

	function guessIndent__guessIndent ( code ) {
		var lines, tabbed, spaced, min;
	
		lines = code.split( '\n' );
	
		tabbed = lines.filter( function ( line ) {
			return /^\t+/.test( line );
		});
	
		spaced = lines.filter( function ( line ) {
			return /^ +/.test( line );
		});
	
		// More lines tabbed than spaced? Assume tabs, and
		// default to tabs in the case of a tie (or nothing
		// to go on)
		if ( tabbed.length >= spaced.length ) {
			return '\t';
		}
	
		// Otherwise, we need to guess the multiple
		min = spaced.reduce( function ( previous, current ) {
			var numSpaces = /^ +/.exec( current )[0].length;
			return Math.min( numSpaces, previous );
		}, Infinity );
	
		return new Array( min + 1 ).join( ' ' );
	}
	var guessIndent__default = guessIndent__guessIndent;

	function encodeMappings__encodeMappings ( original, str, mappings, hires, sourceIndex, offsets ) {
		var lineStart,
			locations,
			lines,
			encoded,
			inverseMappings,
			charOffset = 0,
			firstSegment = true;
	
		// store locations, for fast lookup
		lineStart = 0;
		locations = original.split( '\n' ).map( function ( line ) {
			var start = lineStart;
			lineStart += line.length + 1; // +1 for the newline
	
			return start;
		});
	
		inverseMappings = encodeMappings__invert( str, mappings );
	
		lines = str.split( '\n' ).map( function ( line ) {
			var segments, len, char, origin, lastOrigin, i, location;
	
			segments = [];
	
			len = line.length;
			for ( i = 0; i < len; i += 1 ) {
				char = i + charOffset;
				origin = inverseMappings[ char ];
	
				if ( !~origin ) {
					if ( !~lastOrigin ) {
						// do nothing
					} else {
						segments.push({
							generatedCodeColumn: i,
							sourceIndex: sourceIndex,
							sourceCodeLine: 0,
							sourceCodeColumn: 0
						});
					}
				}
	
				else {
					if ( !hires && ( origin === lastOrigin + 1 ) ) {
						// do nothing
					} else {
						location = encodeMappings__getLocation( locations, origin );
	
						segments.push({
							generatedCodeColumn: i,
							sourceIndex: sourceIndex,
							sourceCodeLine: location.line,
							sourceCodeColumn: location.column
						});
					}
				}
	
				lastOrigin = origin;
			}
	
			charOffset += line.length + 1;
			return segments;
		});
	
		offsets = offsets || {};
	
		offsets.sourceIndex = offsets.sourceIndex || 0;
		offsets.sourceCodeLine = offsets.sourceCodeLine || 0;
		offsets.sourceCodeColumn = offsets.sourceCodeColumn || 0;
	
		encoded = lines.map( function ( segments ) {
			var generatedCodeColumn = 0;
	
			return segments.map( function ( segment ) {
				var arr = [
					segment.generatedCodeColumn - generatedCodeColumn,
					segment.sourceIndex - offsets.sourceIndex,
					segment.sourceCodeLine - offsets.sourceCodeLine,
					segment.sourceCodeColumn - offsets.sourceCodeColumn
				];
	
				generatedCodeColumn = segment.generatedCodeColumn;
				offsets.sourceIndex = segment.sourceIndex;
				offsets.sourceCodeLine = segment.sourceCodeLine;
				offsets.sourceCodeColumn = segment.sourceCodeColumn;
	
				firstSegment = false;
	
				return vlq__default.encode( arr );
			}).join( ',' );
		}).join( ';' );
	
		return encoded;
	}
	var encodeMappings__default = encodeMappings__encodeMappings;
	
	
	function encodeMappings__invert ( str, mappings ) {
		var inverted = new Uint32Array( str.length ), i;
	
		// initialise everything to -1
		i = str.length;
		while ( i-- ) {
			inverted[i] = -1;
		}
	
		// then apply the actual mappings
		i = mappings.length;
		while ( i-- ) {
			if ( ~mappings[i] ) {
				inverted[ mappings[i] ] = i;
			}
		}
	
		return inverted;
	}
	
	function encodeMappings__getLocation ( locations, char ) {
		var i;
	
		i = locations.length;
		while ( i-- ) {
			if ( locations[i] <= char ) {
				return {
					line: i,
					column: char - locations[i]
				};
			}
		}
	
		throw new Error( 'Character out of bounds' );
	}

	var index__MagicString = function ( string ) {
		this.original = this.str = string;
		this.mappings = index__initMappings( string.length );
	
		this.indentStr = guessIndent__default( string );
	};
	
	index__MagicString.prototype = {
		append: function ( content ) {
			this.str += content;
			return this;
		},
	
		clone: function () {
			var clone, i;
	
			clone = new index__MagicString( this.original );
			clone.str = this.str;
	
			i = clone.mappings.length;
			while ( i-- ) {
				clone.mappings[i] = this.mappings[i];
			}
	
			return clone;
		},
	
		generateMap: function ( options ) {
			options = options || {};
	
			return new SourceMap__default({
				file: ( options.file ? options.file.split( '/' ).pop() : null ),
				sources: [ options.source ? getRelativePath__default( options.file || '', options.source ) : null ],
				sourcesContent: options.includeContent ? [ this.original ] : [ null ],
				names: [],
				mappings: this.getMappings( options.hires, 0 )
			});
		},
	
		getMappings: function ( hires, sourceIndex, offsets ) {
			return encodeMappings__default( this.original, this.str, this.mappings, hires, sourceIndex, offsets );
		},
	
		indent: function ( indentStr, options ) {
			var self = this,
				mappings = this.mappings,
				reverseMappings = index__reverse( mappings, this.str.length ),
				pattern = /\n(.)/g,
				match,
				inserts = [ 0 ],
				adjustments,
				exclusions,
				lastEnd,
				i;
	
			if ( typeof indentStr === 'object' ) {
				options = indentStr;
				indentStr = undefined;
			}
	
			indentStr = indentStr !== undefined ? indentStr : this.indentStr;
	
			options = options || {};
	
			// Process exclusion ranges
			if ( options.exclude ) {
				exclusions = typeof options.exclude[0] === 'number' ? [ options.exclude ] : options.exclude;
	
				exclusions = exclusions.map( function ( range ) {
					var rangeStart, rangeEnd;
	
					rangeStart = self.locate( range[0] );
					rangeEnd = self.locate( range[1] );
	
					if ( rangeStart === null || rangeEnd === null ) {
						throw new Error( 'Cannot use indices of replaced characters as exclusion ranges' );
					}
	
					return [ rangeStart, rangeEnd ];
				});
	
				exclusions.sort( function ( a, b ) {
					return a[0] - b[0];
				});
	
				// check for overlaps
				lastEnd = -1;
				exclusions.forEach( function ( range ) {
					if ( range[0] < lastEnd ) {
						throw new Error( 'Exclusion ranges cannot overlap' );
					}
	
					lastEnd = range[1];
				});
			}
	
			if ( !exclusions ) {
				while ( match = pattern.exec( this.str ) ) {
					inserts.push( match.index + 1 );
				}
	
				this.str = indentStr + this.str.replace( pattern, '\n' + indentStr + '$1' );
			} else {
				while ( match = pattern.exec( this.str ) ) {
					if ( !isExcluded( match.index ) ) {
						inserts.push( match.index + 1 );
					}
				}
	
				this.str = indentStr + this.str.replace( pattern, function ( match, $1, index ) {
					return isExcluded( index ) ? match : '\n' + indentStr + $1;
				});
			}
	
			adjustments = inserts.map( function ( index ) {
				var origin;
	
				do {
					origin = reverseMappings[ index++ ];
				} while ( !~origin && index < self.str.length );
	
				return origin;
			});
	
			i = adjustments.length;
			lastEnd = this.mappings.length;
			while ( i-- ) {
				index__adjust( self.mappings, adjustments[i], lastEnd, ( ( i + 1 ) * indentStr.length ) );
				lastEnd = adjustments[i];
			}
	
			return this;
	
			function isExcluded ( index ) {
				var i = exclusions.length, range;
	
				while ( i-- ) {
					range = exclusions[i];
	
					if ( range[1] < index ) {
						return false;
					}
	
					if ( range[0] <= index ) {
						return true;
					}
				}
			}
		},
	
		insert: function ( index, content ) {
			if ( index === 0 ) {
				this.prepend( content );
			} else if ( index === this.original.length ) {
				this.append( content );
			} else {
				this.replace( index, index, content );
			}
	
			return this;
		},
	
		// get current location of character in original string
		locate: function ( character ) {
			var loc;
	
			if ( character < 0 || character > this.mappings.length ) {
				throw new Error( 'Character is out of bounds' );
			}
	
			loc = this.mappings[ character ];
			return ~loc ? loc : null;
		},
	
		locateOrigin: function ( character ) {
			var i;
	
			if ( character < 0 || character >= this.str.length ) {
				throw new Error( 'Character is out of bounds' );
			}
	
			i = this.mappings.length;
			while ( i-- ) {
				if ( this.mappings[i] === character ) {
					return i;
				}
			}
	
			return null;
		},
	
		prepend: function ( content ) {
			this.str = content + this.str;
			index__adjust( this.mappings, 0, this.mappings.length, content.length );
			return this;
		},
	
		remove: function ( start, end ) {
			this.replace( start, end, '' );
			return this;
		},
	
		replace: function ( start, end, content ) {
			var firstChar, lastChar, d;
	
			firstChar = this.locate( start );
			lastChar = this.locate( end - 1 );
	
			if ( firstChar === null || lastChar === null ) {
				throw new Error( 'Cannot replace the same content twice' );
			}
	
			this.str = this.str.substr( 0, firstChar ) + content + this.str.substring( lastChar + 1 );
	
			d = content.length - ( lastChar + 1 - firstChar );
	
			index__blank( this.mappings, start, end );
			index__adjust( this.mappings, end, this.mappings.length, d );
			return this;
		},
	
		slice: function ( start, end ) {
			var firstChar, lastChar;
	
			firstChar = this.locate( start );
			lastChar = this.locate( end - 1 ) + 1;
	
			if ( firstChar === null || lastChar === null ) {
				throw new Error( 'Cannot use replaced characters as slice anchors' );
			}
	
			return this.str.slice( firstChar, lastChar );
		},
	
		toString: function () {
			return this.str;
		},
	
		trim: function () {
			return this.trimStart().trimEnd();
		},
	
		trimEnd: function () {
			var self = this;
	
			this.str = this.str.replace( /\s+$/, function ( trailing, index, str ) {
				var strLength = str.length,
					length = trailing.length,
					i,
					chars = [];
	
				i = strLength;
				while ( i-- > strLength - length ) {
					chars.push( self.locateOrigin( i ) );
				}
	
				i = chars.length;
				while ( i-- ) {
					if ( chars[i] !== null ) {
						self.mappings[ chars[i] ] = -1;
					}
				}
	
				return '';
			});
	
			return this;
		},
	
		trimStart: function () {
			var self = this;
	
			this.str = this.str.replace( /^\s+/, function ( leading ) {
				var length = leading.length, i, chars = [], adjustmentStart = 0;
	
				i = length;
				while ( i-- ) {
					chars.push( self.locateOrigin( i ) );
				}
	
				i = chars.length;
				while ( i-- ) {
					if ( chars[i] !== null ) {
						self.mappings[ chars[i] ] = -1;
						adjustmentStart += 1;
					}
				}
	
				index__adjust( self.mappings, adjustmentStart, self.mappings.length, -length );
	
				return '';
			});
	
			return this;
		}
	};
	
	index__MagicString.Bundle = Bundle__default;
	
	function index__adjust ( mappings, start, end, d ) {
		var i = end;
		while ( i-- > start ) {
			if ( ~mappings[i] ) {
				mappings[i] += d;
			}
		}
	}
	
	function index__initMappings ( i ) {
		var mappings = new Uint32Array( i );
	
		while ( i-- ) {
			mappings[i] = i;
		}
	
		return mappings;
	}
	
	function index__blank ( mappings, start, i ) {
		while ( i-- > start ) {
			mappings[i] = -1;
		}
	}
	
	function index__reverse ( mappings, i ) {
		var result, location;
	
		result = new Uint32Array( i );
	
		while ( i-- ) {
			result[i] = -1;
		}
	
		i = mappings.length;
		while ( i-- ) {
			location = mappings[i];
	
			if ( ~location ) {
				result[ location ] = i;
			}
		}
	
		return result;
	}
	
	var index__default = index__MagicString;

	return index__default;

}));
//# sourceMappingURL=./magic-string.js.map