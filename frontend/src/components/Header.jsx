import {useState} from 'react';

function Header({user, onShowPage, onLogout}) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleUserMenuClick = () => {
        if (user) {
            onLogout();
        } else {
            onShowPage('login');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // 검색 결과 페이지로 이동하거나, 게시글 목록 페이지에 검색 쿼리를 전달
            // App.js에서 onShowPage가 파라미터를 받을 수 있도록 설계되었다고 가정
            onShowPage('posts', { query: searchQuery });
            // setSearchQuery(''); // Optionally clear search after submission
        }
        console.log('검색:', searchQuery);
    };

    return (
        <header
            className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7edf4] px-4 md:px-10 py-3 bg-white">
            <div className="flex items-center gap-4 md:gap-8">
                <div className="flex items-center gap-4 text-[#0d141c]">
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
                </div>
            </div>

            <div className="flex flex-1 justify-end gap-2 md:gap-4 max-w-xs md:max-w-none">
                <form onSubmit={handleSearch} className="flex flex-col min-w-32 md:min-w-40 !h-10 max-w-64"> {/* form 태그 사용 */}
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
                            // onKeyPress는 form onSubmit으로 대체 가능
                        />
                        {/* 검색 버튼을 명시적으로 추가하거나, Enter키로 form 제출 유도 */}
                        <button type="submit" className="hidden">Search</button>
                    </div>
                </form>

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