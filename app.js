const loadButton = document.getElementById("loadButton");
const status = document.getElementById("status");
const parkingList = document.getElementById("parkingList");


loadButton.addEventListener("click", loadParking);


async function loadParking() {

    loadButton.disabled = true;

    status.textContent = "주차장 정보를 불러오는 중...";

    parkingList.innerHTML = "";


    try {

        const response = await fetch("/api/parking");


        if (!response.ok) {

            throw new Error(
                `HTTP 오류: ${response.status}`
            );

        }


        const data = await response.json();


        console.log("API Response:", data);


        /*
         * 현재는 API 응답 구조를
         * 확인하기 위한 단계입니다.
         *
         * 실제 부산 API 구조를 확인한 뒤
         * 아래 renderParkingList()를 완성합니다.
         */


        status.textContent = "조회 성공";


        parkingList.innerHTML = `
            <div class="empty">
                API 연결 성공
                <br>
                브라우저 개발자 도구의 Console에서
                응답 데이터를 확인하세요.
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
                <br>
                ${escapeHtml(error.message)}
            </div>
        `;

    }
    finally {

        loadButton.disabled = false;

    }
}


/*
 * HTML에 데이터를 출력할 때
 * XSS 공격을 방지하기 위한 함수입니다.
 */
function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}