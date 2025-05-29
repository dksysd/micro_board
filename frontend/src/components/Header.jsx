import {useState} from 'react';

function Header({user, onShowPage, onLogout}) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleUserMenuClick = () => {
        if (user) {
            // 사용자가 로그인된 경우 로그아웃 또는 프로필 메뉴 표시
            onLogout();
        } else {
            // 로그인되지 않은 경우 로그인 페이지로 이동
            onShowPage('login');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // TODO: 검색 기능 구현
        console.log('검색:', searchQuery);
    };

    return (
        <header
            className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7edf4] px-4 md:px-10 py-3 bg-white">
            <div className="flex items-center gap-4 md:gap-8">
                <div className="flex items-center gap-4 text-[#0d141c]">
                    <div className="size-4">
                        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor"></path>
                        </svg>
                    </div>
                    <h2 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em]">MicroBoard</h2>
                </div>
                <div className="hidden md:flex items-center gap-9">
                    <button
                        className="text-[#0d141c] text-sm font-medium leading-normal hover:text-[#0c7ff2] transition-colors"
                        onClick={() => onShowPage('posts')}
                    >
                        홈
                    </button>
                    <button
                        className="text-[#0d141c] text-sm font-medium leading-normal hover:text-[#0c7ff2] transition-colors"
                        onClick={() => onShowPage('write')}
                    >
                        글쓰기
                    </button>
                    <button
                        className="text-[#0d141c] text-sm font-medium leading-normal hover:text-[#0c7ff2] transition-colors">
                        카테고리
                    </button>
                </div>
            </div>

            <div className="flex flex-1 justify-end gap-2 md:gap-4 max-w-xs md:max-w-none">
                <div className="flex flex-col min-w-32 md:min-w-40 !h-10 max-w-64">
                    <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                        <div
                            className="text-[#49739c] flex border-none bg-[#e7edf4] items-center justify-center pl-3 md:pl-4 rounded-l-xl border-r-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor"
                                 viewBox="0 0 256 256">
                                <path
                                    d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="검색..."
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-full placeholder:text-[#49739c] px-2 md:px-4 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch(e);
                                }
                            }}
                        />
                    </div>
                </div>

                <button
                    className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 bg-[#e7edf4] text-[#0d141c] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 hover:bg-[#d1d9e0] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor"
                         viewBox="0 0 256 256">
                        <path
                            d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
                    </svg>
                </button>

                <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 cursor-pointer hover:ring-2 hover:ring-[#0c7ff2] transition-all"
                    style={{
                        backgroundImage: user
                            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%230c7ff2'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3E${user.username?.charAt(0).toUpperCase() || 'U'}%3C/text%3E%3C/svg%3E")`
                            : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%2349739c'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3EU%3C/text%3E%3C/svg%3E")`
                    }}
                    onClick={handleUserMenuClick}
                ></div>
            </div>
        </header>
    );
}

export default Header;