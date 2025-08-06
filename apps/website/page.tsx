"use client";

import React from "react";
import { NFTEngagementCard } from "@/components/Post/NFTEngagementCard";
import { EngagementStats } from "@/components/Post/EngagementStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCw, PlusCircle, Award } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorTokenAccount: string;
  imageUrl: string;
  createdAt: string;
  nftAddress?: string;
}

// Sample NFT post data for demonstration
const featuredPost: Post = {
  id: "viral-post-main",
  title: "The Evolution of Web3 Social Media",
  content:
    "Web3 is revolutionizing social media by giving content creators ownership over their work through NFTs. With blockchain-based engagement tracking, creators can be fairly compensated based on the actual engagement their content receives, creating a transparent and equitable ecosystem.",
  author: "@web3pioneer",
  authorTokenAccount: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  imageUrl: "https://picsum.photos/seed/featured/800/600",
  createdAt: "2025-05-15T08:00:00Z",
  nftAddress: "9C2HRbrbvf3baZ8vXhQgiDjJRU1K6JoxUSBhpQsuPW3",
};

// Sample viral posts for showcase
const viralPosts: Post[] = [
  {
    id: "viral-post-1",
    title: "The Future of Decentralized Finance",
    content: "DeFi protocols are creating new financial paradigms...",
    author: "@defi_analyst",
    authorTokenAccount: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    imageUrl: "https://picsum.photos/seed/defi/800/600",
    createdAt: "2025-05-10T12:00:00Z",
    nftAddress: "8QybW5rUrMtj76pePrf4YmPPWvUTTsyRGfpJMTQB5X8B",
  },
  {
    id: "viral-post-2",
    title: "NFTs and the Creator Economy",
    content: "How NFTs are empowering digital creators...",
    author: "@nft_creator",
    authorTokenAccount: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    imageUrl: "https://picsum.photos/seed/nfts/800/600",
    createdAt: "2025-05-08T15:30:00Z",
  },
  {
    id: "viral-post-3",
    title: "Solana's Rise in the Web3 Ecosystem",
    content: "Examining Solana's growth and potential...",
    author: "@solana_dev",
    authorTokenAccount: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    imageUrl: "https://picsum.photos/seed/solana/800/600",
    createdAt: "2025-05-05T09:15:00Z",
    nftAddress: "D6JoƞCxhJKs3SiTFM7UHgkVVMi4fGPonqNPK6LdJuGV",
  },
];

export default function ViralNFTFeed() {
  const { connected } = useWallet();

  // Sample engagement data for the featured post
  const featuredEngagementData = {
    likesCount: 1256,
    sharesCount: 284,
    commentsCount: 187,
    tipsCount: 42,
    totalTipsAmount: 12_500_000_000, // 12.5 SOL in lamports
    engagementScore: 2845,
    tier: 4,
    recentEngagements: [],
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Viral NFT Feed</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
          Discover trending content minted as NFTs with on-chain engagement
          tracking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-8">
          <NFTEngagementCard postId={featuredPost.id} postData={featuredPost} />

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">More Viral Content</h2>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Feed
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viralPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <div className="relative w-full h-48">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                    {post.nftAddress && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary/80 hover:bg-primary">
                          <Award className="h-3 w-3 mr-1" />
                          NFT
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        {post.author} •{" "}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-1">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4 line-clamp-2">{post.content}</p>
                    <div className="flex justify-between items-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/post/${post.id}`}>View Post</Link>
                      </Button>
                      {post.nftAddress && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/engagement-tracking?postId=${post.id}`}>
                            View Engagement
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <Button variant="outline">
                Load More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Featured Post Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <EngagementStats
                postId={featuredPost.id}
                engagementData={featuredEngagementData}
              />

              <div className="mt-4">
                <Link href="/engagement-tracking">
                  <Button className="w-full">Explore Engagement System</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Viral Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Share your ideas and monetize your content through our
                blockchain-based engagement tracking system.
              </p>
              <Button className="w-full" disabled={!connected}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Post
              </Button>
              {!connected && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Please connect your wallet to create content
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trending Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">#web3</Badge>
                <Badge variant="secondary">#NFTs</Badge>
                <Badge variant="secondary">#solana</Badge>
                <Badge variant="secondary">#defi</Badge>
                <Badge variant="secondary">#metaverse</Badge>
                <Badge variant="secondary">#blockchain</Badge>
                <Badge variant="secondary">#crypto</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
