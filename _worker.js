export default {

    async fetch(request, env) {

        const url = new URL(request.url);

        if (url.pathname === "/api/geocode") {

            const kakaoKey =
                env.KAKAO_REST_API_KEY;

            if (!kakaoKey) {

                return jsonResponse(
                    {
                        success: false,
                        message:
                            "KAKAO_REST_API_KEY가 설정되지 않았습니다."
                    },
                    500
                );

            }

            const address =
                url.searchParams.get("address");


            if (!address) {

                return jsonResponse(
                    {
                        success: false,
                        message:
                            "address 파라미터가 필요합니다."
                    },
                    400
                );

            }


            try {

                const kakaoUrl =
                    new URL(
                        "https://dapi.kakao.com/v2/local/search/address.json"
                    );


                kakaoUrl.searchParams.set(
                    "query",
                    address
                );


                const response =
                    await fetch(
                        kakaoUrl.toString(),
                        {
                            headers: {
                                "Authorization":
                                    `KakaoAK ${kakaoKey}`
                            }
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Kakao Geocode Response:",
                    data
                );


                if (!response.ok) {

                    return jsonResponse(
                        {
                            success: false,
                            message:
                                "카카오 주소 검색 API 호출 실패",
                            status:
                                response.status,
                            data
                        },
                        502
                    );

                }


                return jsonResponse(
                    data,
                    200
                );

            }
            catch (error) {

                console.error(
                    "Kakao Geocode Error:",
                    error
                );


                return jsonResponse(
                    {
                        success: false,
                        message:
                            "주소 좌표 변환 중 오류가 발생했습니다.",
                        error:
                            error.message
                    },
                    500
                );

            }

        }

        /*
         * 부산 공영주차장 API
         */
        if (url.pathname === "/api/parking") {

            const apiKey =
                env.BUSAN_PARKING_API_KEY;


            /*
             * Cloudflare Secret 확인
             */
            if (!apiKey) {

                return jsonResponse(
                    {
                        success: false,
                        message:
                            "Cloudflare API KEY가 설정되지 않았습니다."
                    },
                    500
                );

            }


            try {

                /*
                 * 부산광역시 공영주차장 API
                 */
                const apiUrl =
                    new URL(
                        "https://apis.data.go.kr/6260000/BusanPblcPrkngInfoService/getPblcPrkngInfo"
                    );


                /*
                 * API 요청 파라미터
                 */
                apiUrl.searchParams.set(
                    "ServiceKey",
                    apiKey
                );

                apiUrl.searchParams.set(
                    "pageNo",
                    "1"
                );

                apiUrl.searchParams.set(
                    "numOfRows",
                    "1000"
                );

                apiUrl.searchParams.set(
                    "resultType",
                    "json"
                );


                /*
                 * 부산 API 호출
                 */
                const response =
                    await fetch(apiUrl.toString());


                const data =
                    await response.json();


                console.log(
                    "Busan API Response:",
                    data
                );


                /*
                 * 부산 API 자체 오류 확인
                 */
                if (!response.ok) {

                    return jsonResponse(
                        {
                            success: false,
                            message:
                                "부산 공공데이터 API 호출 실패",
                            status:
                                response.status,
                            data
                        },
                        502
                    );

                }


                /*
                 * 부산 API 응답 그대로 전달
                 *
                 * 다음 단계에서
                 * 우리가 사용하기 편한 형태로
                 * 변환할 예정입니다.
                 */
                return jsonResponse(
                    data,
                    200
                );

            }
            catch (error) {

                console.error(
                    "Busan Parking API Error:",
                    error
                );


                return jsonResponse(
                    {
                        success: false,
                        message:
                            "부산 공영주차장 API 호출 중 오류가 발생했습니다.",
                        error:
                            error.message
                    },
                    500
                );

            }

        }


        /*
         * API가 아닌 요청
         *
         * index.html
         * style.css
         * app.js
         * 등의 정적 파일 처리
         */
        return env.ASSETS.fetch(request);

    }

};


/*
 * JSON 응답 함수
 */
function jsonResponse(data, status = 200) {

    return new Response(
        JSON.stringify(data),
        {
            status,

            headers: {
                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "no-store"
            }
        }
    );

}