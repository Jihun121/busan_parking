const loadButton =
    document.getElementById("loadButton");

const status =
    document.getElementById("status");

const parkingList =
    document.getElementById("parkingList");


loadButton.addEventListener(
    "click",
    loadParking
);


async function loadParking() {

    loadButton.disabled = true;

    status.textContent =
        "주차장 정보를 불러오는 중...";

    parkingList.innerHTML = "";


    try {

        const response =
            await fetch("/api/parking");


        if (!response.ok) {

            throw new Error(
                `HTTP 오류: ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "부산 공영주차장 API Response:",
            data
        );


        status.textContent =
            `조회 성공`;


        /*
         * 일단 실제 API 응답을
         * 브라우저 화면에 표시
         */
        parkingList.innerHTML = `

            <div class="empty">

                부산 공영주차장 API 연결 성공

                <br><br>

                전체 데이터:
                ${data.response?.body?.totalCount ?? "확인 필요"}

                <br>

                브라우저 개발자 도구
                Console에서 API 응답을 확인하세요.

            </div>

        `;


    }
    catch (error) {

        console.error(error);


        status.textContent =
            "주차장 정보를 불러오지 못했습니다.";


        parkingList.innerHTML = `

            <div class="empty">

                데이터를 불러오지 못했습니다.

                <br><br>

                ${escapeHtml(
            error.message
        )}

            </div>

        `;

    }
    finally {

        loadButton.disabled = false;

    }

}


/*
 * XSS 방지
 */
function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}