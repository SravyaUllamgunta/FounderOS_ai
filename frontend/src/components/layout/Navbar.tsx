"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { Menu, Sun, Moon, Bell, Search, Sparkles, Loader2, LogOut } from "lucide-react";
import { navigationItems } from "./Sidebar";
import apiClient from "@/services/apiClient";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onMenuClick: () => void;
}

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

interface SearchResult {
  id: string;
  name: string;
  firm: string;
  role: string;
  location: string;
  typical_check: string;
  status: string;
  match_score: number;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Find current active item title
  const activeItem = navigationItems.find((item) => item.href === pathname);
  const pageTitle = activeItem ? activeItem.name : "FounderOS AI";

  // Fetch Notifications list
  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get<NotificationItem[]>("/api/notifications");
      setNotifications(response.data);
    } catch (err) {
      console.warn("Failed to fetch notifications.", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications list every 10 seconds in background
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle Search Input Change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      setShowSearchDropdown(true);
      try {
        const response = await apiClient.get<SearchResult[]>(`/api/search?query=${searchQuery}`);
        setSearchResults(response.data);
      } catch (err) {
        console.warn("Failed semantic Qdrant search.", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark notification read and navigate
  const handleNotificationClick = async (notif: NotificationItem) => {
    setShowNotificationsDropdown(false);
    try {
      if (!notif.isRead) {
        await apiClient.post(`/api/notifications/${notif.id}/read`);
        fetchNotifications();
      }
      // Navigate to the linked dynamic content (e.g. /relationships/p5)
      router.push(notif.link);
      toast.showSuccess(`Navigated to notification alert: ${notif.title}`);
    } catch (err) {
      console.warn("Failed to mark notification read.", err);
      router.push(notif.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-background/80 dark:bg-background/60 border-b border-border/50 backdrop-blur-md">
      {/* Left side: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg md:hidden text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right side: Global search, AI credits, notifications, theme switch, avatar */}
      <div className="flex items-center gap-4">
        {/* Search - Desktop */}
        <div ref={searchRef} className="hidden lg:block relative">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/80 bg-accent/20 w-64 hover:bg-accent/40 transition-colors">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search investors, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 p-0 text-xs text-foreground focus:ring-0 focus:outline-hidden w-full font-medium"
            />
            {searchLoading ? (
              <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
            ) : (
              <kbd className="text-[9px] text-muted-foreground bg-accent border border-border px-1.5 py-0.5 rounded-sm select-none">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Search Dropdown list */}
          {showSearchDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg p-2 space-y-1 z-30 max-h-72 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between border-b border-border/40 pb-1.5">
                <span>Semantic Matches (Qdrant)</span>
                <Badge variant="outline" className="text-[8px] bg-indigo-500/10 text-indigo-500 py-0 leading-none">AI Vector</Badge>
              </div>
              {searchResults.length > 0 ? (
                searchResults.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => {
                      setShowSearchDropdown(false);
                      setSearchQuery("");
                      router.push(`/relationships/${res.id}`);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-accent flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs mt-0.5">
                      {res.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="text-xs space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-foreground">{res.name}</span>
                        <span className="text-[9px] font-bold text-indigo-500">{res.match_score}% fit</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{res.role} at {res.firm}</p>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground/80 font-semibold pt-0.5">
                        <span>{res.location}</span>
                        <span>•</span>
                        <span>₹{res.typical_check}</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No matching investment partners found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Credit status indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-semibold border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chief of Staff Active</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Notification bell */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
            className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotificationsDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg p-2 space-y-1.5 z-30 max-h-96 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between border-b border-border/40 pb-1.5">
                <span>Relationship Alerts</span>
                {unreadCount > 0 && <span className="text-[9px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.2 rounded">{unreadCount} New</span>}
              </div>
              
              {notifications.length > 0 ? (
                <div className="space-y-1">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-2.5 rounded-lg hover:bg-accent flex items-start gap-2.5 transition-colors cursor-pointer border ${
                        notif.isRead ? "border-transparent opacity-75" : "border-indigo-500/15 bg-indigo-500/5"
                      }`}
                    >
                      <div className="flex-1 text-xs space-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-extrabold text-foreground leading-snug">{notif.title}</span>
                          {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-normal">{notif.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No notifications recorded.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-border/80" />

        {/* User avatar */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold leading-none">{user?.name}</div>
            <span className="text-[10px] text-muted-foreground">{user?.role}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
