/**
 * 本类意在方便实现定速增长相关功能。
 * 
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @param {number} now 当前值
 * @param {number} speed 速度(/s)
 * @param {number} direction 增长方向(正数为正增长，负数为负增长)绝对值大小与速度乘积为实际增长速度
 * @param {number} loop 循环模式(0:不循环， 1:单向循环 2:双向循环)
 */
function Value(min, max, now, speed, direction, loop) {
    let last = Date.now();
    let dir = direction;
    let changed = false;
    let old = now;

    const updatew = () => {
        now += dir * speed * (Date.now() - last) / 1000;
        last = Date.now();  
        if (loop == 2 && (now < min || now > max)) {
            dir = - dir;
        }
        while (now < min || now > max) {
            switch (loop) {
                case 0:{
                    if (now > max) now = max;
                    if (now < min) now = min;
                    dir = 0;
                    break;
                }
                case 1:{
                    if (now > max) now = now - max + min;
                    if (now < min) now = now - min + max;
                    break;
                }
                case 2:{
                    if (now > max) now = max * 2 - now;
                    if (now < min) now = min * 2 - now;
                    break;
                }
            }
        }
        changed = old != now;
        old = now;
        return now;
    }

    /**
     * 获得当前值
     * @param {Boolean} update 是否一并更新 
     * @returns {number} 当前值
     */
    this.get = (update) => {
        if (update) updatew();
        return now;
    }

    /**
     * 转向（设置增长方向）
     * @param {number} direction 增长方向(正数为正增长，负数为负增长)绝对值大小与速度乘积为实际增长速度
     */
    this.turn = (direction) => dir = direction;
    
    /**
     * @returns {number} 增长方向
     */
    this.dir = () => dir;
    
    /**
     * 设置当前值
     * @param {number} value 新的当前值
     * @param {number} direction 新的增长方向(正数为正增长，负数为负增长)绝对值大小与速度乘积为实际增长速度
     */
    this.set = (value, direction) => {now = value; dir = direction; last = Date.now();};

    /**
     * 
     * @param {Boolean} update 是否一并更新 
     * @returns {Boolean} 是否发生变化
     */
    this.isChanged = (update) => {
        if (update) updatew();
        return changed;
    }

    /**
     * 更新当前值
     */
    this.update = () => updatew();

    /**
     * 设置速度并返回更新后的速度
     * @param {number | Null} newSpeed 新的速度(/s) null 代表不改变速度
     */
    this.speed = (newSpeed) => {
        if (newSpeed != null) speed = newSpeed;
        return speed;
    }
}