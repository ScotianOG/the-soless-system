import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Book, Copy, Share2 } from 'lucide-react';
import { loadMarkdownFile } from '../utils/docs-loader';
import { renderMarkdown } from '../utils/markdown';

const DocumentReader = () => {
  const { docId } = useParams<{ docId: string }>();
  const [document, setDocument] = useState<{
    title: string;
    content: string;
    icon?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!docId) {
        setError('No document ID provided');
        setLoading(false);
        return;
      }

      try {
        const doc = await loadMarkdownFile(docId);
        setDocument({
          title: doc.title || 'Untitled Document',
          content: doc.content,
          icon: doc.icon
        });
      } catch (error) {
        console.error('Failed to load document:', error);
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [docId]);

  const copyToClipboard = () => {
    if (!document) return;
    
    // Create a temporary element to hold the text
    const el = window.document.createElement('textarea');
    el.value = document.content.replace(/---[\s\S]+?---/m, '').trim(); // Remove frontmatter
    window.document.body.appendChild(el);
    el.select();
    window.document.execCommand('copy');
    window.document.body.removeChild(el);
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareDocument = () => {
    if (navigator.share) {
      navigator.share({
        title: document?.title || 'SOLess Documentation',
        text: 'Check out this documentation!',
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soless-blue"></div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-gray-300">{error || 'Document not found'}</p>
          <Link to="/docs" className="inline-block mt-4 text-soless-blue hover:text-soless-blue/80">
            Return to Documentation
          </Link>
        </div>
      </div>
    );
  }

  // Remove frontmatter from content
  const cleanContent = document.content.replace(/---[\s\S]+?---/m, '').trim();
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link to="/docs" className="inline-flex items-center text-soless-blue hover:text-soless-blue/80 mb-4">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Documentation
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">{document.title}</h1>
          <div className="flex space-x-2">
            <button 
              onClick={copyToClipboard}
              className="bg-black/50 border border-soless-blue/40 p-2 rounded-lg hover:bg-black/70 transition-colors"
              title="Copy content"
            >
              <Copy className="h-5 w-5 text-gray-300" />
              {copied && (
                <span className="absolute -bottom-8 right-0 text-xs bg-soless-blue/90 text-white px-2 py-1 rounded">
                  Copied!
                </span>
              )}
            </button>
            <button 
              onClick={shareDocument}
              className="bg-black/50 border border-soless-blue/40 p-2 rounded-lg hover:bg-black/70 transition-colors"
              title="Share document"
            >
              <Share2 className="h-5 w-5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Document content */}
      <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6 md:p-8">
        <div 
          className="prose prose-invert max-w-none prose-headings:text-soless-blue prose-a:text-soless-blue prose-pre:bg-black/50 prose-pre:border prose-pre:border-soless-blue/20 prose-code:text-soless-blue"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(cleanContent) }}
        />
      </div>
    </div>
  );
};

export default DocumentReader;
