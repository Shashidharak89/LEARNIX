'use client';

import React from 'react';
import Link from 'next/link';
import { FaCalendarAlt, FaClock, FaUser, FaArrowRight } from 'react-icons/fa';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';
import ImageContainer from '../components/ImageContainer';
import articlesData from './articlesData.json';
import './styles/Articles.css';

const ArticlesPage = () => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="articles-page">
      <Navbar />
      
      <main className="articles-main">
        <div className="articles-container">
          {/* Header Section */}
          <div className="articles-header">
            <h1 className="articles-title">Articles</h1>
            <p className="articles-subtitle">
              Insights, updates, and stories from the Learnix community
            </p>
          </div>

          {/* Featured Article */}
          {articlesData.length > 0 && (
            <div className="featured-article">
              <div className="featured-image-container">
                <ImageContainer 
                  imageUrl={articlesData[0].image} 
                  altText={articlesData[0].title}
                />
                <div className="featured-badge">Featured</div>
              </div>
              <div className="featured-content">
                <div className="article-meta">
                  <span className="meta-item">
                    <FaCalendarAlt className="meta-icon" />
                    {formatDate(articlesData[0].date)}
                  </span>
                  <span className="meta-item">
                    <FaClock className="meta-icon" />
                    {articlesData[0].readTime}
                  </span>
                  <span className="meta-item">
                    <FaUser className="meta-icon" />
                    {articlesData[0].author}
                  </span>
                </div>
                <h2 className="featured-title">{articlesData[0].title}</h2>
                <p className="featured-description">{articlesData[0].description}</p>
                <Link href={`/articles/${articlesData[0].id}`} className="read-more-btn">
                  Read Full Article
                  <FaArrowRight className="btn-icon" />
                </Link>
              </div>
            </div>
          )}

          {/* Articles Grid */}
          <div className="articles-section">
            <h2 className="section-title">All Articles</h2>
            <div className="articles-grid">
              {articlesData.map((article) => (
                <article key={article.id} className="article-card">
                  <div className="card-image-container">
                    <ImageContainer 
                      imageUrl={article.image} 
                      altText={article.title}
                    />
                  </div>
                  <div className="card-content">
                    <div className="card-meta">
                      <span className="meta-date">
                        <FaCalendarAlt className="meta-icon" />
                        {formatDate(article.date)}
                      </span>
                      <span className="meta-read-time">
                        <FaClock className="meta-icon" />
                        {article.readTime}
                      </span>
                    </div>
                    <h3 className="card-title">{article.title}</h3>
                    <p className="card-description">{article.description}</p>
                    <Link href={`/articles/${article.id}`} className="card-link">
                      Read More
                      <FaArrowRight className="link-icon" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArticlesPage;
