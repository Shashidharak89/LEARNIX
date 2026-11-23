export function stripKeywords(data) {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(stripKeywords);
    }
    if (typeof data === "object" && !(data instanceof Date)) {
        const cleaned = {};
        for (const [key, val] of Object.entries(data)) {
            if (key === "keywords") continue;
            if (val && typeof val === "object") {
                cleaned[key] = stripKeywords(val);
            } else {
                cleaned[key] = val;
            }
        }
        return cleaned;
    }
    return data;
}
