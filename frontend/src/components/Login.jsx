import {useState} from 'react';
import { authAPI, apiUtils } from '../utils/api';

function Login({onShowPage, onLogin}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            setError('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await authAPI.signin({email, password});

            if (response && response.user && response.token) {
                apiUtils.setToken(response.token);
                apiUtils.setUser(response.user);
                onLogin(response.user); // App.js로 사용자 정보 전달 및 페이지 전환
            } else {
                setError('로그인 응답이 올바르지 않습니다.');
            }
        } catch (err) {
            console.error('로그인 실패:', err);
            setError(apiUtils.getErrorMessage(err) || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="flex flex-col w-full max-w-[400px] mx-auto py-5">
            <h2 className="text-[#0d141c] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
                환영합니다
            </h2>

            {error && (
                <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-4 px-4 py-3">
                <div className="flex flex-col">
                    <input
                        type="email"
                        placeholder="이메일"
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49739c] p-4 text-base font-normal leading-normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                </div>

                <div className="flex flex-col">
                    <input
                        type="password"
                        placeholder="비밀번호"
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49739c] p-4 text-base font-normal leading-normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="flex px-4 py-3">
                <button
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 flex-1 bg-[#0c7ff2] text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0b6fd1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={isLoading || !email.trim() || !password.trim()}
                >
                    <span className="truncate">{isLoading ? '로그인 중...' : '로그인'}</span>
                </button>
            </div>

            <p className="text-[#49739c] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
                계정이 없으신가요?{' '}
                <button
                    className="text-[#0c7ff2] hover:underline transition-all"
                    onClick={() => onShowPage('signup')}
                    disabled={isLoading}
                >
                    회원가입
                </button>
            </p>
        </div>
    );
}

export default Login;