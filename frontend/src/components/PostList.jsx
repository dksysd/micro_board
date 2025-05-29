import {useState} from 'react';

function PostList({onShowPage}) {
    const [currentPage, setCurrentPage] = useState(1);

    // 샘플 데이터
    const posts = [
        {
            id: 1,
            title: "Docker Swarm을 활용한 마이크로서비스 아키텍처 구성",
            author: "김개발",
            date: "2024년 1월 15일",
            comments: 5,
            excerpt: "Docker Swarm을 사용하여 마이크로서비스 아키텍처를 구성하는 방법에 대해 알아보겠습니다...",
            image: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=225&fit=crop"
        },
        {
            id: 2,
            title: "Node.js와 Express로 REST API 구축하기",
            author: "이백엔드",
            date: "2024년 1월 14일",
            comments: 8,
            excerpt: "Node.js와 Express 프레임워크를 사용하여 RESTful API를 구축하는 방법을 단계별로...",
            image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=225&fit=crop"
        },
        {
            id: 3,
            title: "React Hooks를 활용한 상태 관리 패턴",
            author: "박프론트",
            date: "2024년 1월 13일",
            comments: 3,
            excerpt: "React Hooks를 사용한 효과적인 상태 관리 방법을 알아보겠습니다...",
            image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop"
        },
        {
            id: 4,
            title: "PostgreSQL 성능 최적화 가이드",
            author: "최데이터",
            date: "2024년 1월 12일",
            comments: 12,
            excerpt: "대용량 데이터 처리를 위한 PostgreSQL 성능 최적화 기법들을 소개합니다...",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
        },
        {
            id: 5,
            title: "JWT 토큰 보안 모범 사례",
            author: "정보안",
            date: "2024년 1월 11일",
            comments: 7,
            excerpt: "JWT 토큰을 안전하게 사용하기 위한 보안 가이드라인과 모범 사례들을...",
            image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop"
        },
        {
            id: 6,
            title: "Nginx를 이용한 로드 밸런싱 구성",
            author: "한인프라",
            date: "2024년 1월 10일",
            comments: 4,
            excerpt: "Nginx를 사용하여 효과적인 로드 밸런싱을 구성하는 방법과 설정 팁들을...",
            image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=225&fit=crop"
        }
    ];

    const handlePageChange = (page) => {
        setCurrentPage(page);
        // TODO: 실제 페이지 데이터 로드
    };

    const handlePostClick = (postId) => {
        // TODO: 선택된 게시글 ID 저장
        onShowPage('post-detail');
    };

    return (
        <>
            <div className="flex flex-wrap justify-between gap-3 p-4">
                <p className="text-[#0d141c] tracking-light text-[32px] font-bold leading-tight min-w-72">최근 게시글</p>
                <button
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#0c7ff2] text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0b6fd1] transition-colors"
                    onClick={() => onShowPage('write')}
                >
                    <span className="truncate">새 글 작성</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="flex flex-col gap-3 pb-3 bg-white rounded-xl p-4 border border-[#e7edf4] hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => handlePostClick(post.id)}
                    >
                        <div
                            className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                            style={{backgroundImage: `url("${post.image}")`}}
                        ></div>
                        <div>
                            <p className="text-[#0d141c] text-base font-bold leading-normal mb-2">{post.title}</p>
                            <p className="text-[#49739c] text-sm font-normal leading-normal mb-1">{post.author}</p>
                            <p className="text-[#49739c] text-sm font-normal leading-normal mb-2">{post.date} ·
                                댓글 {post.comments}개</p>
                            <p className="text-[#49739c] text-sm font-normal leading-normal">{post.excerpt}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-center p-4 gap-2">
                <button
                    className="flex size-10 items-center justify-center rounded-full hover:bg-[#e7edf4] transition-colors"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor"
                         viewBox="0 0 256 256">
                        <path
                            d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
                    </svg>
                </button>

                {[1, 2, 3].map((page) => (
                    <button
                        key={page}
                        className={`text-sm font-${currentPage === page ? 'bold' : 'normal'} leading-normal flex size-10 items-center justify-center text-[#0d141c] rounded-full ${currentPage === page ? 'bg-[#e7edf4]' : 'hover:bg-[#e7edf4]'} transition-colors`}
                        onClick={() => handlePageChange(page)}
                    >
                        {page}
                    </button>
                ))}

                <span
                    className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#0d141c] rounded-full">...</span>

                <button
                    className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#0d141c] rounded-full hover:bg-[#e7edf4] transition-colors"
                    onClick={() => handlePageChange(10)}
                >
                    10
                </button>

                <button
                    className="flex size-10 items-center justify-center rounded-full hover:bg-[#e7edf4] transition-colors"
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor"
                         viewBox="0 0 256 256">
                        <path
                            d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                    </svg>
                </button>
            </div>
        </>
    );
}

export default PostList;