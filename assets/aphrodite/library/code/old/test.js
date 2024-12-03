{
    function Parent(a, b) {
        this.ai = a;
        this.b = b;
    }
    Parent.prototype.a = function() {
        return this.ai;
    }

    function Child(d, e, f) {
        Parent.call(this, d, e);
        this.fi = f;
    }
    Child.prototype = Object.create(Parent.prototype);
    Child.prototype.constructor = Child;
    Child.prototype.f = function() {
        return this.fi;
    }
}

{
    function Parent(a, b) {
        this.a = () => a;
        this.b = b;
    }
    
    function Child(d, e, f) {
        Parent.call(this, d, e);
        this.f = () => f;
    }
}
