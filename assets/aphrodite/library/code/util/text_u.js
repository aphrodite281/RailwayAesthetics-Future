const TextU = {
    CP: (str) => {
        str = str + "";
        let ts = str.split(/\|/);
        return ts[0];
    }
,
    NP: (str) => {
        str = str + "";
        let ts = str.split(/\|/);
        if (ts.length > 1) return ts[1];
        return "";
    }
,
    EP: (str) => {
        str = str + "";
        let ts = str.split(/\|\|/);
        if (ts.length > 1) return ts[1];
        return "";
    }
,
    FP: (str) => {
        str = str + "";
        let ts = str.split(':');
        if (ts.length != 2) throw new Error("Invalid format for FP: " + str);
        return ts[0];
    }
,
    SP: (str) => {
        str = str + "";
        let ts = str.split(':');
        if (ts.length != 2) throw new Error("Invalid format for SP: " + str);
        return ts[1];
    }
}
const TU = TextU;