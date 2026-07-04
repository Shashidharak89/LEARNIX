/**
 * Utility to handle deleted or null references in populated documents
 * Shows "NA" for missing references instead of null
 */

export function formatReference(ref, fields = ["name", "code"]) {
    if (!ref) {
        return "NA";
    }

    // Handle both string and object formats
    if (typeof ref === "string" || ref instanceof String) {
        return ref || "NA";
    }

    // For objects, try to find a meaningful display value
    if (typeof ref === "object") {
        for (const field of fields) {
            if (ref[field]) {
                return `${ref[field]}${ref.code && ref.code !== ref[field] ? ` (${ref.code})` : ""}`;
            }
        }
    }

    return "NA";
}

/**
 * Format a populated document by replacing null references with "NA"
 */
export function formatDocumentReferences(doc, referenceFields = []) {
    const formatted = doc.toObject ? doc.toObject() : { ...doc };

    referenceFields.forEach((field) => {
        if (field in formatted) {
            formatted[field] = formatReference(formatted[field]);
        }
    });

    return formatted;
}

/**
 * Handle the case where a referenced document is deleted
 * This can be used in middleware or query handlers
 */
export function sanitizeReferences(doc, fields = []) {
    const sanitized = doc.toObject ? doc.toObject() : { ...doc };

    fields.forEach((field) => {
        if (sanitized[field] === null || sanitized[field] === undefined) {
            sanitized[field] = "NA";
        } else if (typeof sanitized[field] === "object" && !sanitized[field]._id) {
            // Reference was deleted but field still exists as ObjectId
            sanitized[field] = "NA";
        }
    });

    return sanitized;
}
