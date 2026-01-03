'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FaCalendarAlt, FaClock, FaUser, FaArrowLeft, FaShare } from 'react-icons/fa';
import { Navbar } from '../../components/Navbar';
import Footer from '../../components/Footer';
import ImageContainer from '../../components/ImageContainer';
import articlesData from '../articlesData.json';
import '../styles/ArticleDetail.css';

const ArticleDetailPage = () => {
  const params = useParams();
  const articleId = params?.id;
  
  const article = articlesData.find(a => a.id === articleId);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleShare = () => {
    const url = window.location.href;
    const title = article?.title || 'Article';
    const text = `Check out this article: ${title}`;
    
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(url)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Failed to copy link'));
    }
  };

  if (!article) {
    return (
      <div className="article-page">
        <Navbar />
        <main className="article-main">
          <div className="article-container">
            <div className="article-not-found">
              <h2>Article Not Found</h2>
              <p>The article you're looking for doesn't exist.</p>
              <Link href="/articles" className="back-to-articles">
                <FaArrowLeft />
                Back to Articles
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get related articles (excluding current)
  const relatedArticles = articlesData.filter(a => a.id !== articleId).slice(0, 2);

  return (
    <div className="article-page">
      <Navbar />
      
      <main className="article-main">
        <div className="article-container">
          {/* Back Button */}
          <Link href="/articles" className="back-link">
            <FaArrowLeft className="back-icon" />
            Back to Articles
          </Link>

          {/* Article Header */}
          <header className="article-header">
            <div className="article-meta-bar">
              <span className="meta-item">
                <FaCalendarAlt className="meta-icon" />
                {formatDate(article.date)}
              </span>
              <span className="meta-item">
                <FaClock className="meta-icon" />
                {article.readTime}
              </span>
              <span className="meta-item">
                <FaUser className="meta-icon" />
                {article.author}
              </span>
            </div>
            <h1 className="article-title">{article.title}</h1>
            <p className="article-description">{article.description}</p>
          </header>

          {/* Featured Image */}
          <div className="article-image-container">
            <ImageContainer 
              imageUrl={article.image} 
              altText={article.title}
            />
          </div>

          {/* Article Content */}
          <article className="article-content">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="article-paragraph">
                {paragraph}
              </p>
            ))}
          </article>

          {/* Share Section */}
          <div className="article-share">
            <span className="share-label">Share this article:</span>
            <button onClick={handleShare} className="share-btn">
              <FaShare />
              Share
            </button>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="related-articles">
              <h2 className="related-title">Related Articles</h2>
              <div className="related-grid">
                {relatedArticles.map((relatedArticle) => (
                  <Link 
                    key={relatedArticle.id} 
                    href={`/articles/${relatedArticle.id}`}
                    className="related-card"
                  >
                    <div className="related-image-container">
                      <ImageContainer 
                        imageUrl={relatedArticle.image} 
                        altText={relatedArticle.title}
                      />
                    </div>
                    <div className="related-content">
                      <span className="related-date">
                        <FaCalendarAlt className="related-icon" />
                        {formatDate(relatedArticle.date)}
                      </span>
                      <h3 className="related-card-title">{relatedArticle.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArticleDetailPage;
