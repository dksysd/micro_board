import { useState, useEffect } from 'react';
import Header from './components/Header';
import PostList from './components/PostList';
import PostDetail from './components/PostDetail';
import WritePost from './components/WritePost';
import Login from './components/Login';
import Signup from './components/Signup';
import { apiUtils, authAPI } from './utils/api';

function App() {
    const [currentPage, setCurrentPage] = useState('posts');
    const [currentPageParams, setCurrentPageParams] = useState({}); // To store postId, searchQuery, etc.
    const [user, setUser] = useState(apiUtils.getUser()); // Initialize user from localStorage
    const [appIsLoading, setAppIsLoading] = useState(true); // For initial user session check

    // Effect for initial user session check and token verification
    useEffect(() => {
        const verifyUserSession = async () => {
            const token = apiUtils.getToken();
            // If there's a token but no user state (e.g., after a page refresh)
            // or if you want to re-verify the token even if user state exists.
            if (token) {
                if (!user) { // Only fetch profile if user state is not already set from localStorage
                    try {
                        console.log("Attempting to fetch profile with token...");
                        const profileData = await authAPI.getProfile(); // Fetches user profile using the token
                        apiUtils.setUser(profileData); // Save/update user in localStorage
                        setUser(profileData);
                        console.log("Profile fetched and user set:", profileData);
                    } catch (error) {
                        console.error("Failed to verify token or fetch profile:", error);
                        apiUtils.logout(); // Clear invalid token and user data
                        setUser(null);
                        // Optionally redirect to login if verification fails critically
                        // setCurrentPage('login');
                        // setCurrentPageParams({});
                    }
                }
            } else {
                // No token, ensure user is logged out
                if (user) { // If user state somehow exists without a token
                    apiUtils.logout();
                    setUser(null);
                }
            }
            setAppIsLoading(false);
        };

        verifyUserSession();
    }, []); // Run once on component mount

    // Modified showPage to accept parameters
    const showPage = (pageId, params = {}) => {
        setCurrentPage(pageId);
        setCurrentPageParams(params);
        window.scrollTo(0, 0); // Scroll to top on page change
    };

    const handleLogin = (userData) => {
        setUser(userData);
        // After login, typically redirect to 'posts' or a 'dashboard'
        // If there was a page they tried to access before login, you could redirect there.
        // For simplicity, always go to 'posts'.
        showPage('posts');
    };

    const handleLogout = () => {
        apiUtils.logout(); // Clears token and user from localStorage
        setUser(null);
        showPage('login'); // Redirect to login page after logout
    };

    const renderCurrentPage = () => {
        if (appIsLoading) {
            return (
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-xl text-gray-600">Loading MicroBoard...</p>
                    {/* You can add a spinner here */}
                </div>
            );
        }

        switch (currentPage) {
            case 'posts':
                return <PostList
                    onShowPage={showPage}
                    user={user}
                    searchQuery={currentPageParams.query} // Pass searchQuery
                />;
            case 'post-detail':
                // Ensure postId is passed, otherwise, redirect or show error
                if (!currentPageParams.postId) {
                    // console.warn("PostDetail called without postId, redirecting to posts.");
                    // For a better UX, you might want to store the intended post and retry after login
                    // or show a specific "post not found" message if the ID was truly invalid.
                    return <PostList onShowPage={showPage} user={user} />;
                }
                return <PostDetail
                    onShowPage={showPage}
                    user={user}
                    postId={currentPageParams.postId} // Pass postId
                />;
            case 'write':
                if (!user) { // If user tries to access 'write' page directly without login
                    showPage('login', { from: 'write' }); // Optionally pass 'from' to redirect back after login
                    return <Login onShowPage={showPage} onLogin={handleLogin}/>;
                }
                return <WritePost onShowPage={showPage} user={user} />;
            case 'login':
                return <Login onShowPage={showPage} onLogin={handleLogin} />;
            case 'signup':
                return <Signup onShowPage={showPage} onLogin={handleLogin} />;
            default:
                return <PostList onShowPage={showPage} user={user} />;
        }
    };

    return (
        <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden"
             style={{fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif'}}>
            <div className="layout-container flex h-full grow flex-col">
                <Header
                    user={user}
                    onShowPage={showPage} // Pass the modified showPage
                    onLogout={handleLogout}
                />

                <div className="px-0 sm:px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-0 sm:py-5">
                    {/* Adjusted padding for better mobile view (full width content area) */}
                    <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1 bg-white sm:rounded-xl sm:shadow-sm">
                        {/* Added w-full, bg-white, sm:rounded-xl, sm:shadow-sm for content area styling */}
                        {renderCurrentPage()}
                    </div>
                </div>
                {/* Optional Footer can go here */}
                {/* <footer className="text-center p-4 bg-gray-100 text-sm text-gray-600">
                    © {new Date().getFullYear()} MicroBoard
                </footer> */}
            </div>
        </div>
    );
}

export default App;