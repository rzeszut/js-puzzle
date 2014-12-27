/** Shuffles this array. Returns self */
Array.prototype.shuffle = function () {
    var i, swap, ind;

    for (i = this.length - 1; i > 0; --i) {
        ind = parseInt(Math.random() * i);

        swap = this[i];
        this[i] = this[ind];
        this[ind] = swap;
    }

    return this;
};

