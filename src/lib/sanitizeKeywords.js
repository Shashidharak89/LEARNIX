function isPlainObject(obj) {
    if (typeof obj !== "object" || obj === null) return false;
    const proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
}

export function stripKeywords(data) {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(stripKeywords);
    }
    if (typeof data === "object") {
        // Preserve non-plain objects like ObjectId, Date, Buffer, etc.
        // so their prototype methods (like .toString(), .toJSON()) are not lost
        if (!isPlainObject(data)) {
            return data;
        }
        const cleaned = {};
        for (const [key, val] of Object.entries(data)) {
            if (key === "keywords") continue;
            cleaned[key] = stripKeywords(val);
        }
        return cleaned;
    }
    return data;
}
