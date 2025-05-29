import {useState} from 'react';
import { authAPI, apiUtils } from '../utils/api';

function Signup({onShowPage, onLogin}) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const validateForm = () => {
        if (!username.trim()) {
            setError('사용자명을 입력해주세요.');
            return false;
        }
        if (!email.trim()) {
            setError('이메일을 입력해주세요.');
            return false;
        }
        if (!email.includes('@')) {
            setError('올바른 이메일 형식을 입력해주세요.');
            return false;
        }
        if (!password.trim()) {
            setError('비밀번호를 입력해주세요.');
            return false;
        }
        if (password.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다.');
            return false;
        }
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return false;
        }
        setError(''); // Clear previous errors
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await authAPI.signup({username, email, password});

            if (response && response.user && response.token) {
                // 회원가입 성공 후 바로 로그인 처리
                apiUtils.setToken(response.token);
                apiUtils.setUser(response.user);
                onLogin(response.user); // App.js로 사용자 정보 전달 및 페이지 전환
            } else {
                // 백엔드에서 user와 token을 반환하지 않는 경우, 로그인 페이지로 유도할 수 있음
                setError('회원가입 응답이 올바르지 않습니다. 로그인 해주세요.');
                onShowPage('login'); // Or handle differently
            }

        } catch (err) {
            console.error('회원가입 실패:', err);
            setError(apiUtils.getErrorMessage(err) || '회원가입에 실패했습니다. 다시 시도해주세요.');
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
                회원가입
            </h2>

            {error && (
                <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-4 px-4 py-3">
                <div className="flex flex-col">
                    <input
                        type="text"
                        placeholder="사용자명"
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49739c] p-4 text-base font-normal leading-normal"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                </div>

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

                <div className="flex flex-col">
                    <input
                        type="password"
                        placeholder="비밀번호 확인"
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#0d141c] focus:outline-0 focus:ring-0 border-none bg-[#e7edf4] focus:border-none h-14 placeholder:text-[#49739c] p-4 text-base font-normal leading-normal"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="flex px-4 py-3">
                <button
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 flex-1 bg-[#0c7ff2] text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0b6fd1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={isLoading || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()}
                >
                    <span className="truncate">{isLoading ? '가입 중...' : '회원가입'}</span>
                </button>
            </div>

            <p className="text-[#49739c] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
                이미 계정이 있으신가요?{' '}
                <button
                    className="text-[#0c7ff2] hover:underline transition-all"
                    onClick={() => onShowPage('login')}
                    disabled={isLoading}
                >
                    로그인
                </button>
            </p>
        </div>
    );
}

export default Signup;