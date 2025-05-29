import {useState} from 'react';

function WritePost({onShowPage, user}) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            onShowPage('login');
            return;
        }

        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            // TODO: API 호출로 게시글 작성
            console.log('게시글 작성:', {title, content});
            alert('게시글이 성공적으로 작성되었습니다.');
            onShowPage('posts');
        } catch (error) {
            console.error('게시글 작성 실패:', error);
            alert('게시글 작성에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (title.trim() || content.trim()) {
            if (window.confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
                onShowPage('posts');
            }
        } else {
            onShowPage('posts');
        }
    };

    return (
        <div className="flex flex-col w-full max-w-[600px] mx-auto py-5">
            <div className="flex flex-wrap justify-between gap-3 p-4">
                <p className="text-[#0d141c] tracking-light text-[32px] font-bold leading-tight">새 글 작성</p>
            </div>

            <div className="flex flex-col gap-4 px-4 py-3">
                <div className="flex flex-col">
                    <input
                        type="text"
                        placeholder="제목을 입력하세요"
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49739c] p-4 text-base font-normal leading-normal"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div className="flex flex-col">
          <textarea
              placeholder="내용을 입력하세요..."
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none min-h-[300px] placeholder:text-[#49739c] p-4 text-base font-normal leading-normal"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
          />
                </div>
            </div>

            <div className="flex justify-end gap-3 px-4 py-3">
                <button
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#e7edf4] text-[#0d141c] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#d1d9e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCancel}
                    disabled={isLoading}
                >
                    <span className="truncate">취소</span>
                </button>
                <button
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#0c7ff2] text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0b6fd1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={isLoading || !title.trim() || !content.trim()}
                >
                    <span className="truncate">{isLoading ? '발행 중...' : '발행'}</span>
                </button>
            </div>
        </div>
    );
}

export default WritePost;