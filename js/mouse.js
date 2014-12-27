var getMousePosition = (function () {

    /** Helper function -- cache one-arguments function. */
    function memoize(fn) {
        var cache = {};
        return function (arg) {
            var cachedValue = cache[arg];

            // when value is not present in cache, compute it
            if (cachedValue === undefined) {
                cachedValue = cache[arg] = fn(arg);
            }
            return cachedValue;
        }
    }

    /** Calculates left-top offset of the passed element */
    var calculateElementOffset = memoize(function (element) {
        var x = 0, y = 0;

        if (element.offsetParent) {
            do {
                x += element.offsetLeft;
                y += element.offsetTop;
            } while ((element = element.offsetParent));
        }

        return {x: x, y: y};
    });

    /** Get computed style value as integet */
    function getStyleIntValue(canvas, styleName) {
        return parseInt(
            document.defaultView.getComputedStyle(canvas, null)[styleName],
        10) || 0;
    }

    /** Calculate all styling-related offsets */
    var calculateStyleOffsets = memoize(function (canvas) {
        var html = document.body.parentNode;

        return {
            padding: {
                left: getStyleIntValue(canvas, 'paddingLeft'),
                top: getStyleIntValue(canvas, 'paddingTop')
            },
            border: {
                left: getStyleIntValue(canvas, 'borderLeftWidth'),
                top: getStyleIntValue(canvas, 'borderTopWidth')
            },
            html: {
                left: html.offsetLeft,
                top: html.offsetTop
            }
        }
    });

    /** Adds paddings and borders to the offset */
    function applyStyleOffsets(offset, canvas) {
        var s = calculateStyleOffsets(canvas);

        return {
            x: offset.x + s.padding.left + s.border.left + s.html.left,
            y: offset.y + s.padding.top + s.border.top + s.html.top
        };
    }

    /** Calculate mouse position with out any offsets */
    return function (event, canvas) {
        var offset = applyStyleOffsets(calculateElementOffset(canvas), canvas);

        return {
            x: event.pageX - offset.x,
            y: event.pageY - offset.y
        }
    };
})();

