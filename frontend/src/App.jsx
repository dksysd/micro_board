import {useState} from 'react';
import Header from './components/Header';
import PostList from './components/PostList';
import PostDetail from './components/PostDetail';
import WritePost from './components/WritePost';
import Login from './components/Login';
import Signup from './components/Signup';

function App() {
    const [currentPage, setCurrentPage] = useState('posts');
    const [user, setUser] = useState(null);

    const showPage = (pageId) => {
        setCurrentPage(pageId);
    };

    const handleLogin = (userData) => {
        setUser(userData);
        setCurrentPage('posts');
    };

    const handleLogout = () => {
        setUser(null);
        setCurrentPage('posts');
    };

    const renderCurrentPage = () => {
        switch (currentPage) {
            case 'posts':
                return <PostList onShowPage={showPage}/>;
            case 'post-detail':
                return <PostDetail onShowPage={showPage} user={user}/>;
            case 'write':
                return <WritePost onShowPage={showPage} user={user}/>;
            case 'login':
                return <Login onShowPage={showPage} onLogin={handleLogin}/>;
            case 'signup':
                return <Signup onShowPage={showPage} onLogin={handleLogin}/>;
            default:
                return <PostList onShowPage={showPage}/>;
        }
    };

    return (
        <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden"
             style={{fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif'}}>
            <div className="layout-container flex h-full grow flex-col">
                <Header
                    user={user}
                    onShowPage={showPage}
                    onLogout={handleLogout}
                />

                <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
                    <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
                        {renderCurrentPage()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;