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
}