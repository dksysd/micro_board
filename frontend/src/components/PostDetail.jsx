import {useState} from 'react';

function PostDetail({onShowPage, user}) {
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // 샘플 게시글 데이터
    const post = {
        id: 1,
        title: "Docker Swarm을 활용한 마이크로서비스 아키텍처 구성",
        author: "김개발",
        date: "2024년 1월 15일",
        views: 245,
        likes: 125,
        comments: 32,
        shares: 15,
        image: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=400&fit=crop",
        content: `안녕하세요! 오늘은 Docker Swarm을 활용하여 마이크로서비스 아키텍처를 구성하는 방법에 대해 자세히 알아보겠습니다.

## 1. Docker Swarm 소개

Docker Swarm은 Docker의 네이티브 클러스터링 및 오케스트레이션 도구입니다. 여러 Docker 호스트를 하나의 가상 Docker 호스트로 관리할 수 있게 해줍니다.

## 2. 마이크로서비스 아키텍처 설계

우리가 구성할 MicroBoard 플랫폼은 다음과 같은 서비스들로 구성됩니다:

• Auth Service: 사용자 인증 및 권한 관리
• Post Service: 게시글 관리
• Comment Service: 댓글 관리
• API Gateway: 서비스 라우팅 및 로드 밸런싱

## 3. 네트워크 분리 전략

보안을 강화하기 위해 다음과 같이 네트워크를 분리합니다:

• frontend-net: 프론트엔드와 API Gateway 간 통신
• backend-net: API Gateway와 백엔드 서비스 간 통신
• db-net: 백엔드 서비스와 데이터베이스 간 통신`
    };

    // 샘플 댓글 데이터
    const [comments, setComments] = useState([
        {
            id: 1,
            author: "이백엔드",
            date: "2일 전",
            content: "정말 유용한 정보네요! Docker Swarm의 고가용성 설정 부분도 추가로 다뤄주시면 더 좋을 것 같습니다.",
            likes: 10,
            dislikes: 2,
            avatar: "이"
        },
        {
            id: 2,
            author: "박프론트",
            date: "1일 전",
            content: "네트워크 분리 전략이 인상적이네요. 실제 운영 환경에서도 이런 식으로 구성하시나요?",
            likes: 5,
            dislikes: 1,
            avatar: "박"
        }
    ]);

    const handleSubmitComment = async () => {
        if (!user) {
            alert('댓글을 작성하려면 로그인이 필요합니다.');
            onShowPage('login');
            return;
        }

        if (!newComment.trim()) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        setIsSubmittingComment(true);
        try {
            // TODO: API 호출로 댓글 작성
            const comment = {
                id: comments.length + 1,
                author: user.username,
                date: '방금 전',
                content: newComment,
                likes: 0,
                dislikes: 0,
                avatar: user.username.charAt(0)
            };

            setComments([...comments, comment]);
            setNewComment('');
        } catch (error) {
            console.error('댓글 작성 실패:', error);
            alert('댓글 작성에 실패했습니다.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleLikeComment = (commentId) => {
        // TODO: API 호출로 댓글 좋아요 처리
        console.log('댓글 좋아요:', commentId);
    };

    const formatContent = (content) => {
        return content.split('\n').map((line, index) => {
            if (line.startsWith('## ')) {
                return <h3 key={index}
                           className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] pb-2 pt-4">{line.substring(3)}</h3>;
            } else if (line.startsWith('• ')) {
                return <li key={index} className="mb-1 ml-6">{line.substring(2)}</li>;
            } else if (line.trim() === '') {
                return <br key={index}/>;
            } else {
                return <p key={index}
                          className="text-[#0d141c] text-base font-normal leading-normal pb-3 pt-1">{line}</p>;
            }
        });
    };

    return (
        <>
            <div className="flex flex-wrap gap-2 p-4">
                <button
                    className="text-[#49739c] text-base font-medium leading-normal hover:text-[#0c7ff2] transition-colors"
                    onClick={() => onShowPage('posts')}
                >
                    게시글
                </button>
                <span className="text-[#49739c] text-base font-medium leading-normal">/</span>
                <span
                    className="text-[#0d141c] text-base font-medium leading-normal">Docker Swarm을 활용한 마이크로서비스 아키텍처</span>
            </div>

            <h1 className="text-[#0d141c] tracking-light text-[32px] font-bold leading-tight px-4 text-left pb-3 pt-6">
                {post.title}
            </h1>
            <p className="text-[#49739c] text-sm font-normal leading-normal pb-3 pt-1 px-4">
                {post.author} 작성 · {post.date} · 조회 {post.views}
            </p>

            <div className="flex w-full grow bg-slate-50 py-3">
                <div className="w-full gap-1 overflow-hidden bg-slate-50 aspect-[3/2] flex">
                    <div
                        className="w-full bg-center bg-no-repeat bg-cover aspect-auto rounded-xl flex-1 mx-4"
                        style={{backgroundImage: `url("${post.image}")`}}
                    ></div>
                </div>
            </div>

            <div className="px-4 py-3">
                {formatContent(post.content)}
            </div>

            <div className="flex flex-wrap gap-4 px-4 py-3">
                <div
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e7edf4] transition-colors cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor"
                         viewBox="0 0 256 256" className="text-[#49739c]">
                        <path
                            d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"></path>
                    </svg>
                    <p className="text-[#49739c] text-[13px] font-bold leading-normal tracking-[0.015em]">{post.likes}</p>
                </div>
                <div
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e7edf4] transition-colors cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor"
                         viewBox="0 0 256 256" className="text-[#49739c]">
                        <path
                            d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"></path>
                    </svg>
                    <p className="text-[#49739c] text-[13px] font-bold leading-normal tracking-[0.015em]">{post.comments}</p>
                </div>
                <div
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e7edf4] transition-colors cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor"
                         viewBox="0 0 256 256" className="text-[#49739c]">
                        <path
                            d="M229.66,109.66l-48,48a8,8,0,0,1-11.32-11.32L204.69,112H165a88,88,0,0,0-85.23,66,8,8,0,0,1-15.5-4A103.94,103.94,0,0,1,165,96h39.71L170.34,61.66a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,229.66,109.66ZM192,208H40V88a8,8,0,0,0-16,0V208a16,16,0,0,0,16,16H192a8,8,0,0,0,0-16Z"></path>
                    </svg>
                    <p className="text-[#49739c] text-[13px] font-bold leading-normal tracking-[0.015em]">{post.shares}</p>
                </div>
            </div>

            {/* 댓글 섹션 */}
            <h3 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">댓글</h3>

            {/* 댓글 작성 */}
            <div className="flex items-center px-4 py-3 gap-3">
                <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                    style={{
                        backgroundImage: user
                            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%230c7ff2'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3E${user.username?.charAt(0).toUpperCase() || 'U'}%3C/text%3E%3C/svg%3E")`
                            : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%2349739c'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3EU%3C/text%3E%3C/svg%3E")`
                    }}
                ></div>
                <div className="flex flex-col min-w-40 h-12 flex-1">
                    <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                        <input
                            type="text"
                            placeholder="댓글을 작성해주세요..."
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-full placeholder:text-[#49739c] px-4 rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSubmitComment();
                                }
                            }}
                            disabled={isSubmittingComment}
                        />
                        <div
                            className="flex border-none bg-[#e7edf4] items-center justify-center pr-4 rounded-r-xl border-l-0 !pr-2">
                            <button
                                className="min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#0c7ff2] text-slate-50 text-sm font-medium leading-normal hover:bg-[#0b6fd1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSubmitComment}
                                disabled={isSubmittingComment || !newComment.trim()}
                            >
                                <span className="truncate">{isSubmittingComment ? '게시 중...' : '게시'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 댓글 목록 */}
            {comments.map((comment) => (
                <div key={comment.id} className="flex w-full flex-row items-start justify-start gap-3 p-4">
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%2349739c'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3E${comment.avatar}%3C/text%3E%3C/svg%3E")`
                        }}
                    ></div>
                    <div className="flex h-full flex-1 flex-col items-start justify-start">
                        <div className="flex w-full flex-row items-start justify-start gap-x-3">
                            <p className="text-[#0d141c] text-sm font-bold leading-normal tracking-[0.015em]">{comment.author}</p>
                            <p className="text-[#49739c] text-sm font-normal leading-normal">{comment.date}</p>
                        </div>
                        <p className="text-[#0d141c] text-sm font-normal leading-normal">{comment.content}</p>
                        <div className="flex w-full flex-row items-center justify-start gap-6 pt-2">
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:bg-[#e7edf4] rounded-lg px-2 py-1 transition-colors"
                                onClick={() => handleLikeComment(comment.id)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor"
                                     viewBox="0 0 256 256" className="text-[#49739c]">
                                    <path
                                        d="M234,80.12A24,24,0,0,0,216,72H160V56a40,40,0,0,0-40-40,8,8,0,0,0-7.16,4.42L75.06,96H32a16,16,0,0,0-16,16v88a16,16,0,0,0,16,16H204a24,24,0,0,0,23.82-21l12-96A24,24,0,0,0,234,80.12ZM32,112H72v88H32ZM223.94,97l-12,96a8,8,0,0,1-7.94,7H88V105.89l36.71-73.43A24,24,0,0,1,144,56V80a8,8,0,0,0,8,8h64a8,8,0,0,1,7.94,9Z"></path>
                                </svg>
                                <p className="text-[#49739c] text-sm font-normal leading-normal">{comment.likes}</p>
                            </div>
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:bg-[#e7edf4] rounded-lg px-2 py-1 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor"
                                     viewBox="0 0 256 256" className="text-[#49739c]">
                                    <path
                                        d="M239.82,157l-12-96A24,24,0,0,0,204,40H32A16,16,0,0,0,16,56v88a16,16,0,0,0,16,16H75.06l37.78,75.58A8,8,0,0,0,120,240a40,40,0,0,0,40-40V184h56a24,24,0,0,0,23.82-27ZM72,144H32V56H72Zm150,21.29a7.88,7.88,0,0,1-6,2.71H152a8,8,0,0,0-8,8v24a24,24,0,0,1-19.29,23.54L88,150.11V56H204a8,8,0,0,1,7.94,7l12,96A7.87,7.87,0,0,1,222,165.29Z"></path>
                                </svg>
                                <p className="text-[#49739c] text-sm font-normal leading-normal">{comment.dislikes}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}

export default PostDetail;