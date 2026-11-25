"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiX, FiSearch } from "react-icons/fi";
import "./AdminUI.css";

/**
 * Apple-themed Searchable Dropdown matching QPFilterSearch design.
 * options: Array of { value: string, label: string }
 */
export default function AdminDropdown({
    label,
    options = [],
    value = "",
    onChange,
    placeholder = "Select an option...",
    searchPlaceholder = "Type to search...",
    required = false,
    disabled = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
        if (!isOpen) {
            setSearchKeyword("");
        }
    }, [isOpen]);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));
    const selectedText = selectedOption ? selectedOption.label : null;

    const filteredOptions = searchKeyword.trim()
        ? options.filter((opt) => {
              const kw = searchKeyword.toLowerCase();
              const labelMatch = String(opt.label || "").toLowerCase().includes(kw);
              const keywordMatch = String(opt.keywords || "").toLowerCase().includes(kw);
              return labelMatch || keywordMatch;
          })
        : options;

    return (
        <div className={`adm-custom-dropdown ${disabled ? "is-disabled" : ""}`} ref={dropdownRef}>
            {label && (
                <label className="adm-dropdown-label">
                    {label}
                    {required && <span className="adm-required-star">*</span>}
                </label>
            )}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`adm-dropdown-trigger ${isOpen ? "is-open" : ""}`}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (!disabled && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span
                    className={`adm-dropdown-trigger__text ${!selectedText ? "is-placeholder" : ""}`}
                    title={selectedText || placeholder}
                >
                    {selectedText || placeholder}
                </span>
                <div className="adm-dropdown-trigger__actions">
                    {value && !disabled && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange("");
                                setIsOpen(false);
                            }}
                            className="adm-dropdown-clear-btn"
                            title="Clear selection"
                            aria-label="Clear selection"
                        >
                            <FiX size={15} />
                        </button>
                    )}
                    <FiChevronDown size={16} className="adm-dropdown-chevron" />
                </div>
            </div>

            {isOpen && !disabled && (
                <div className="adm-dropdown-menu" role="listbox">
                    <div className="adm-dropdown-search-wrap" onClick={(e) => e.stopPropagation()}>
                        <FiSearch size={14} className="adm-dropdown-search-icon" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="adm-dropdown-search-input"
                            placeholder={searchPlaceholder}
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                        {searchKeyword && (
                            <button
                                type="button"
                                className="adm-dropdown-search-clear"
                                onClick={() => setSearchKeyword("")}
                                aria-label="Clear search"
                            >
                                <FiX size={14} />
                            </button>
                        )}
                    </div>

                    <div
                        onClick={() => {
                            onChange("");
                            setIsOpen(false);
                        }}
                        className="adm-dropdown-item is-placeholder"
                        role="option"
                        aria-selected={!value}
                    >
                        {placeholder}
                    </div>

                    {filteredOptions.length === 0 ? (
                        <div className="adm-dropdown-empty">No matches found</div>
                    ) : (
                        filteredOptions.map((opt) => {
                            const isSelected = String(value) === String(opt.value);
                            return (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`adm-dropdown-item ${isSelected ? "is-selected" : ""}`}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    {opt.label}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

