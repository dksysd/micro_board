import {useState, useEffect} from 'react';
import { postAPI, apiUtils } from '../utils/api';

// searchQuery prop을 추가하여 App.js로부터 검색어를 받을 수 있도록 합니다.
function PostList({onShowPage, user, searchQuery}) {
    const [posts, setPosts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const postsPerPage = 6; // 한 페이지에 표시할 게시글 수

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            setError('');
            try {
                // API 호출 시 검색어(searchQuery)도 전달
                const data = await postAPI.getPosts(currentPage, postsPerPage, searchQuery);
                setPosts(data.posts || []); // API 응답 형식에 따라 posts 배열 접근
                setTotalPages(data.totalPages || 1); // API 응답 형식에 따라 전체 페이지 수 접근
            } catch (err) {
                console.error("게시글 목록 로드 실패:", err);
                setError(apiUtils.getErrorMessage(err) || "게시글을 불러오는데 실패했습니다.");
                setPosts([]); // 에러 발생 시 게시글 목록 비우기
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [currentPage, searchQuery]); // searchQuery가 변경될 때도 데이터를 다시 가져옴

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handlePostClick = (postId) => {
        // App.js의 onShowPage가 두 번째 인자로 파라미터를 받을 수 있도록 설계되었다고 가정
        onShowPage('post-detail', { postId: postId });
    };

    // 간단한 페이지네이션 UI 생성 로직 (더 개선될 수 있음)
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        const pageNumbers = [];
        const maxPagesToShow = 5; // 중앙에 표시될 최대 페이지 번호 수
        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            startPage = 1;
            endPage = totalPages;
        } else {
            if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
                startPage = 1;
                endPage = maxPagesToShow;
            } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
                startPage = totalPages - maxPagesToShow + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - Math.floor(maxPagesToShow / 2);
                endPage = currentPage + Math.floor(maxPagesToShow / 2);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex items-center justify-center p-4 gap-2">
                <button
                    className="flex size-10 items-center justify-center rounded-full hover:bg-[#e7edf4] transition-colors disabled:opacity-50"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
                    </svg>
                </button>

                {startPage > 1 && (
                    <>
                        <button
                            className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#0d141c] rounded-full hover:bg-[#e7edf4] transition-colors"
                            onClick={() => handlePageChange(1)}
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#0d141c] rounded-full">...</span>}
                    </>
                )}

                {pageNumbers.map((page) => (
                    <button
                        key={page}
                        className={`text-sm font-${currentPage === page ? 'bold' : 'normal'} leading-normal flex size-10 items-center justify-center text-[#0d141c] rounded-full ${currentPage === page ? 'bg-[#e7edf4]' : 'hover:bg-[#e7edf4]'} transition-colors`}
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                    >
                        {page}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages -1 && <span className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#0d141c] rounded-full">...</span>}
                        <button
                            className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#0d141c] rounded-full hover:bg-[#e7edf4] transition-colors"
                            onClick={() => handlePageChange(totalPages)}
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    className="flex size-10 items-center justify-center rounded-full hover:bg-[#e7edf4] transition-colors disabled:opacity-50"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                    </svg>
                </button>
            </div>
        );
    };


    return (
        <>
            <div className="flex flex-wrap justify-between gap-3 p-4">
                <p className="text-[#0d141c] tracking-light text-[32px] font-bold leading-tight min-w-72">
                    {searchQuery ? `"${searchQuery}" 검색 결과` : "최근 게시글"}
                </p>
                {user && ( // 로그인한 사용자에게만 새 글 작성 버튼 표시
                    <button
                        className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#0c7ff2] text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0b6fd1] transition-colors"
                        onClick={() => onShowPage('write')}
                    >
                        <span className="truncate">새 글 작성</span>
                    </button>
                )}
            </div>

            {isLoading && <div className="p-4 text-center">게시글을 불러오는 중...</div>}
            {error && <div className="p-4 text-center text-red-500">{error}</div>}

            {!isLoading && !error && posts.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                    {searchQuery ? "검색 결과가 없습니다." : "게시글이 없습니다."}
                </div>
            )}

            {!isLoading && !error && posts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className="flex flex-col gap-3 pb-3 bg-white rounded-xl p-4 border border-[#e7edf4] hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => handlePostClick(post.id)}
                        >
                            <div
                                className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                                style={{backgroundImage: `url("${post.image || 'https://via.placeholder.com/400x225.png?text=No+Image'}")`}} // 기본 이미지 추가
                            ></div>
                            <div>
                                <p className="text-[#0d141c] text-base font-bold leading-normal mb-2">{post.title}</p>
                                <p className="text-[#49739c] text-sm font-normal leading-normal mb-1">{post.author?.username || post.author || '익명'}</p> {/* API 응답에 따라 author 객체 접근 */}
                                <p className="text-[#49739c] text-sm font-normal leading-normal mb-2">
                                    {new Date(post.createdAt || post.date).toLocaleDateString()} · {/* API 응답에 따라 날짜 필드 접근 */}
                                    댓글 {post.commentsCount || post.comments || 0}개
                                </p>
                                <p className="text-[#49739c] text-sm font-normal leading-normal line-clamp-3">{post.excerpt || post.content?.substring(0,100) + "..."}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {!isLoading && posts.length > 0 && renderPagination()}
        </>
    );
}

export default PostList;