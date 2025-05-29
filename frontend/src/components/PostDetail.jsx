import {useState, useEffect} from 'react';
import { postAPI, commentAPI, apiUtils } from '../utils/api';

// postId prop을 추가하여 App.js로부터 게시글 ID를 받을 수 있도록 합니다.
function PostDetail({onShowPage, user, postId}) {
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    const [isLoadingPost, setIsLoadingPost] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const [postError, setPostError] = useState('');
    const [commentError, setCommentError] = useState(''); // 댓글 목록 로드 에러
    const [submitCommentError, setSubmitCommentError] = useState(''); // 댓글 작성 에러


    // Fetch Post Details
    useEffect(() => {
        if (!postId) {
            setPostError("게시글 ID가 제공되지 않았습니다.");
            setIsLoadingPost(false);
            return;
        }
        const fetchPost = async () => {
            setIsLoadingPost(true);
            setPostError('');
            try {
                const postData = await postAPI.getPost(postId);
                setPost(postData);
            } catch (err) {
                console.error("게시글 상세 정보 로드 실패:", err);
                setPostError(apiUtils.getErrorMessage(err) || "게시글 정보를 불러오는데 실패했습니다.");
            } finally {
                setIsLoadingPost(false);
            }
        };
        fetchPost();
    }, [postId]);

    // Fetch Comments
    useEffect(() => {
        if (!postId) return; // postId가 없으면 댓글을 가져오지 않음
        const fetchComments = async () => {
            setIsLoadingComments(true);
            setCommentError('');
            try {
                const commentsData = await commentAPI.getComments(postId);
                setComments(commentsData.comments || []); // API 응답 형식에 따라
            } catch (err) {
                console.error("댓글 목록 로드 실패:", err);
                setCommentError(apiUtils.getErrorMessage(err) || "댓글을 불러오는데 실패했습니다.");
            } finally {
                setIsLoadingComments(false);
            }
        };
        fetchComments();
    }, [postId]);

    const handleSubmitComment = async () => {
        if (!user) {
            setSubmitCommentError('댓글을 작성하려면 로그인이 필요합니다.');
            // alert('댓글을 작성하려면 로그인이 필요합니다.');
            // onShowPage('login'); // 로그인 페이지로 이동 옵션
            return;
        }
        if (!newComment.trim()) {
            setSubmitCommentError('댓글 내용을 입력해주세요.');
            return;
        }

        setIsSubmittingComment(true);
        setSubmitCommentError('');
        try {
            const createdComment = await commentAPI.createComment(postId, { content: newComment });
            // API가 생성된 댓글 객체를 반환한다고 가정 (작성자 정보 포함)
            // 실제로는 user 객체에서 사용자 정보를 가져와서 프론트에서 구성하거나, 백엔드가 author 정보를 채워줘야 함
            const commentWithOwner = {
                ...createdComment,
                author: createdComment.author || { username: user.username, id: user.id }, // API 응답에 따라 조정
                avatar: createdComment.author?.username?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase(),
                date: "방금 전" // 실제로는 서버 시간 사용
            };
            setComments(prevComments => [commentWithOwner, ...prevComments]); // 새 댓글을 맨 위에 추가
            setNewComment('');
        } catch (err) {
            console.error('댓글 작성 실패:', err);
            setSubmitCommentError(apiUtils.getErrorMessage(err) || '댓글 작성에 실패했습니다.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleLikeComment = async (commentId) => {
        if (!user) {
            alert('로그인이 필요합니다.'); return;
        }
        try {
            const updatedComment = await commentAPI.likeComment(commentId); // API가 업데이트된 댓글 반환 가정
            setComments(comments.map(c => c.id === commentId ? { ...c, likes: updatedComment.likes, likedByCurrentUser: updatedComment.likedByCurrentUser } : c));
        } catch (error) {
            console.error('댓글 좋아요 실패:', error);
            alert('댓글 좋아요 처리에 실패했습니다.');
        }
    };

    const handleDislikeComment = async (commentId) => {
        if (!user) {
            alert('로그인이 필요합니다.'); return;
        }
        try {
            const updatedComment = await commentAPI.dislikeComment(commentId); // API가 업데이트된 댓글 반환 가정
            setComments(comments.map(c => c.id === commentId ? { ...c, dislikes: updatedComment.dislikes, dislikedByCurrentUser: updatedComment.dislikedByCurrentUser } : c));
        } catch (error) {
            console.error('댓글 싫어요 실패:', error);
            alert('댓글 싫어요 처리에 실패했습니다.');
        }
    };

    const handlePostLike = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            onShowPage('login');
            return;
        }
        if (!post || !post.id) return;
        try {
            const updatedPostData = await postAPI.toggleLikePost(post.id);
            // API가 업데이트된 post.likes와 현재 유저의 좋아요 여부를 반환한다고 가정
            setPost(prevPost => ({
                ...prevPost,
                likes: updatedPostData.likesCount !== undefined ? updatedPostData.likesCount : prevPost.likes, // API 응답에 따라 필드명 확인
                likedByCurrentUser: updatedPostData.likedByCurrentUser
            }));
        } catch (error) {
            console.error('Failed to like post:', error);
            alert('게시글 좋아요 처리에 실패했습니다.');
        }
    };


    const formatContent = (content) => {
        if (!content) return null;
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

    if (isLoadingPost) return <div className="p-4 text-center">게시글을 불러오는 중...</div>;
    if (postError) return <div className="p-4 text-center text-red-500">{postError}</div>;
    if (!post) return <div className="p-4 text-center">게시글을 찾을 수 없습니다.</div>;

    // 날짜 포맷 함수 (API 응답에 따라 createdAt, updatedAt 등 사용)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch (e) {
            return dateString; // 원본 반환
        }
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
                    className="text-[#0d141c] text-base font-medium leading-normal truncate max-w-xs md:max-w-md lg:max-w-lg">{post.title}</span>
            </div>

            <h1 className="text-[#0d141c] tracking-light text-[32px] font-bold leading-tight px-4 text-left pb-3 pt-6">
                {post.title}
            </h1>
            <p className="text-[#49739c] text-sm font-normal leading-normal pb-3 pt-1 px-4">
                {post.author?.username || '익명'} 작성 · {formatDate(post.createdAt || post.date)} · 조회 {post.views || 0}
            </p>

            {post.image && (
                <div className="flex w-full grow bg-slate-50 py-3">
                    <div className="w-full gap-1 overflow-hidden bg-slate-50 aspect-[3/2] flex">
                        <div
                            className="w-full bg-center bg-no-repeat bg-cover aspect-auto rounded-xl flex-1 mx-4"
                            style={{backgroundImage: `url("${post.image}")`}}
                        ></div>
                    </div>
                </div>
            )}

            <div className="px-4 py-3 prose max-w-none"> {/* Tailwind CSS Prose plugin for nice article styling */}
                {formatContent(post.content)}
            </div>

            <div className="flex flex-wrap gap-4 px-4 py-3">
                <button // 버튼으로 변경하여 클릭 가능하게 함
                    onClick={handlePostLike}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e7edf4] transition-colors cursor-pointer ${post.likedByCurrentUser ? 'text-[#0c7ff2]' : 'text-[#49739c]'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor"
                         viewBox="0 0 256 256" >
                        <path
                            d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"></path>
                    </svg>
                    <p className="text-[13px] font-bold leading-normal tracking-[0.015em]">{post.likesCount !== undefined ? post.likesCount : (post.likes || 0)}</p>
                </button>
                <div
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e7edf4] transition-colors cursor-pointer"> {/* 댓글 수 클릭은 보통 스크롤 이동 */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor"
                         viewBox="0 0 256 256" className="text-[#49739c]">
                        <path
                            d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"></path>
                    </svg>
                    <p className="text-[#49739c] text-[13px] font-bold leading-normal tracking-[0.015em]">{post.commentsCount || comments.length || 0}</p>
                </div>
                <div // 공유 기능은 UI만 (실제 구현은 복잡)
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e7edf4] transition-colors cursor-pointer"
                    onClick={() => console.log("Share post ID:", post.id)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor"
                         viewBox="0 0 256 256" className="text-[#49739c]">
                        <path
                            d="M229.66,109.66l-48,48a8,8,0,0,1-11.32-11.32L204.69,112H165a88,88,0,0,0-85.23,66,8,8,0,0,1-15.5-4A103.94,103.94,0,0,1,165,96h39.71L170.34,61.66a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,229.66,109.66ZM192,208H40V88a8,8,0,0,0-16,0V208a16,16,0,0,0,16,16H192a8,8,0,0,0,0-16Z"></path>
                    </svg>
                    <p className="text-[#49739c] text-[13px] font-bold leading-normal tracking-[0.015em]">{post.shares || 0}</p>
                </div>
            </div>

            {/* 댓글 섹션 */}
            <h3 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">댓글 ({comments.length})</h3>

            {/* 댓글 작성 */}
            <div className="flex items-start px-4 py-3 gap-3"> {/* items-start for alignment */}
                <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                    style={{
                        backgroundImage: user
                            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%230c7ff2'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3E${user.username?.charAt(0).toUpperCase() || 'U'}%3C/text%3E%3C/svg%3E")`
                            : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%2349739c'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3EU%3C/text%3E%3C/svg%3E")`
                    }}
                ></div>
                <div className="flex flex-col min-w-40 flex-1"> {/* Removed h-12 for auto height */}
                    <div className="flex w-full flex-1 items-stretch rounded-xl"> {/* Removed h-full */}
                        <textarea // input에서 textarea로 변경하여 여러 줄 입력 지원
                            placeholder={user ? "댓글을 작성해주세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none min-h-[48px] h-auto placeholder:text-[#49739c] px-4 py-3 rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal" // py-3 추가
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) { // Shift+Enter로 줄바꿈, Enter로 제출
                                    e.preventDefault();
                                    handleSubmitComment();
                                }
                            }}
                            rows={1} // 초기 row 수
                            disabled={isSubmittingComment || !user}
                            style={{ overflowY: 'auto' }} // 스크롤바
                        />
                        <div
                            className="flex border-none bg-[#e7edf4] items-center justify-center pr-4 rounded-r-xl border-l-0 !pr-2">
                            <button
                                className="min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#0c7ff2] text-slate-50 text-sm font-medium leading-normal hover:bg-[#0b6fd1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSubmitComment}
                                disabled={isSubmittingComment || !newComment.trim() || !user}
                            >
                                <span className="truncate">{isSubmittingComment ? '게시 중...' : '게시'}</span>
                            </button>
                        </div>
                    </div>
                    {submitCommentError && <p className="text-red-500 text-xs mt-1">{submitCommentError}</p>}
                </div>
            </div>

            {/* 댓글 목록 */}
            {isLoadingComments && <p className="p-4 text-center">댓글을 불러오는 중...</p>}
            {commentError && <p className="p-4 text-center text-red-500">{commentError}</p>}
            {!isLoadingComments && !commentError && comments.length === 0 && (
                <p className="p-4 text-center text-gray-500">아직 댓글이 없습니다.</p>
            )}

            {!isLoadingComments && comments.map((comment) => (
                <div key={comment.id} className="flex w-full flex-row items-start justify-start gap-3 p-4 border-t border-[#e7edf4]">
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%2349739c'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3E${(comment.author?.username || '익명').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E")`
                        }}
                    ></div>
                    <div className="flex h-full flex-1 flex-col items-start justify-start">
                        <div className="flex w-full flex-row items-center justify-start gap-x-3"> {/* items-center 추가 */}
                            <p className="text-[#0d141c] text-sm font-bold leading-normal tracking-[0.015em]">{comment.author?.username || '익명'}</p>
                            <p className="text-[#49739c] text-sm font-normal leading-normal">{formatDate(comment.createdAt || comment.date)}</p>
                        </div>
                        <p className="text-[#0d141c] text-sm font-normal leading-normal py-1 whitespace-pre-wrap">{comment.content}</p> {/* py-1, whitespace-pre-wrap 추가 */}
                        <div className="flex w-full flex-row items-center justify-start gap-6 pt-2">
                            <button // 버튼으로 변경
                                className={`flex items-center gap-2 cursor-pointer hover:bg-[#e7edf4] rounded-lg px-2 py-1 transition-colors ${comment.likedByCurrentUser ? 'text-[#0c7ff2]' : 'text-[#49739c]'}`}
                                onClick={() => handleLikeComment(comment.id)}
                                disabled={!user}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor"
                                     viewBox="0 0 256 256">
                                    <path
                                        d="M234,80.12A24,24,0,0,0,216,72H160V56a40,40,0,0,0-40-40,8,8,0,0,0-7.16,4.42L75.06,96H32a16,16,0,0,0-16,16v88a16,16,0,0,0,16,16H204a24,24,0,0,0,23.82-21l12-96A24,24,0,0,0,234,80.12ZM32,112H72v88H32ZM223.94,97l-12,96a8,8,0,0,1-7.94,7H88V105.89l36.71-73.43A24,24,0,0,1,144,56V80a8,8,0,0,0,8,8h64a8,8,0,0,1,7.94,9Z"></path>
                                </svg>
                                <p className="text-sm font-normal leading-normal">{comment.likes || 0}</p>
                            </button>
                            <button // 버튼으로 변경
                                className={`flex items-center gap-2 cursor-pointer hover:bg-[#e7edf4] rounded-lg px-2 py-1 transition-colors ${comment.dislikedByCurrentUser ? 'text-red-500' : 'text-[#49739c]'}`}
                                onClick={() => handleDislikeComment(comment.id)}
                                disabled={!user}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor"
                                     viewBox="0 0 256 256">
                                    <path
                                        d="M239.82,157l-12-96A24,24,0,0,0,204,40H32A16,16,0,0,0,16,56v88a16,16,0,0,0,16,16H75.06l37.78,75.58A8,8,0,0,0,120,240a40,40,0,0,0,40-40V184h56a24,24,0,0,0,23.82-27ZM72,144H32V56H72Zm150,21.29a7.88,7.88,0,0,1-6,2.71H152a8,8,0,0,0-8,8v24a24,24,0,0,1-19.29,23.54L88,150.11V56H204a8,8,0,0,1,7.94,7l12,96A7.87,7.87,0,0,1,222,165.29Z"></path>
                                </svg>
                                <p className="text-sm font-normal leading-normal">{comment.dislikes || 0}</p>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}

export default PostDetail;