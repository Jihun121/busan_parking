export default {

    async fetch(request, env) {

        const url = new URL(request.url);


        /*
         * 부산 공영주차장 API
         */
        if (url.pathname === "/api/parking") {


            /*
             * Cloudflare Secret에서
             * API 인증키를 가져옵니다.
             */
            const apiKey =
                env.BUSAN_PARKING_API_KEY;


            /*
             * Secret이 설정되어 있는지 확인
             */
            if (!apiKey) {

                return new Response(

                    JSON.stringify({
                        success: false,
                        message:
                            "Cloudflare API KEY가 설정되지 않았습니다."
                    }),

                    {
                        status: 500,

                        headers: {
                            "Content-Type":
                                "application/json; charset=UTF-8"
                        }
                    }

                );

            }


            /*
             * --------------------------------
             * 부산 공공데이터 API 호출
             * --------------------------------
             *
             * API 명세 확인 후 이 부분을
             * 실제 요청 코드로 변경합니다.
             */


            return new Response(

                JSON.stringify({
                    success: true,
                    message:
                        "Cloudflare Worker 및 API KEY 연결 성공"
                }),

                {
                    status: 200,

                    headers: {
                        "Content-Type":
                            "application/json; charset=UTF-8"
                    }
                }

            );

        }


        /*
         * API가 아닌 요청
         *
         * 정적 파일 처리
         */
        return env.ASSETS.fetch(request);

    }

};