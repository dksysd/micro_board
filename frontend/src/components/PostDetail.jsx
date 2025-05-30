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
                const response = await postAPI.getPost(postId);
                // 백엔드에서 { post: {...} } 형태로 응답하므로 response.post로 접근
                setPost(response.post || response); // response.post가 없으면 response 자체를 사용 (API 구조에 따라)
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
                setComments(commentsData.comments || commentsData || []); // API 응답 형식에 따라
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
            const response = await commentAPI.createComment(postId, { content: newComment });
            const createdComment = response.comment || response; // API 응답 구조에 따라

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
                    </div>
                </div>
            ))}
        </>
    );
}

export default PostDetail;