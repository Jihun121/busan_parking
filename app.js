const loadButton = document.getElementById("loadButton");
const status = document.getElementById("status");
const parkingList = document.getElementById("parkingList");

let parkingData = [];


/*
 * 주차장 정보 조회
 */
loadButton.addEventListener("click", loadParking);


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


        /*
         * API 응답 데이터 추출
         */
        parkingData =
            data.response?.body?.items?.item ?? [];


        /*
         * 데이터가 배열이 아닌 경우
         */
        if (!Array.isArray(parkingData)) {

            parkingData =
                [parkingData];

        }


        console.log(
            `주차장 ${parkingData.length}개`,
            parkingData
        );


        status.textContent =
            `총 ${parkingData.length}개 주차장`;


        renderParkingList();


    }
    catch (error) {

        console.error(error);


        status.textContent =
            "주차장 정보를 불러오지 못했습니다.";


        parkingList.innerHTML = `

            <div class="empty">

                데이터를 불러오지 못했습니다.

                <br><br>

                ${escapeHtml(error.message)}

            </div>

        `;

    }
    finally {

        loadButton.disabled = false;

    }

}


/*
 * 주차장 목록 출력
 */
function renderParkingList() {

    if (parkingData.length === 0) {

        parkingList.innerHTML = `

            <div class="empty">

                주차장 데이터가 없습니다.

            </div>

        `;

        return;

    }


    parkingList.innerHTML =
        parkingData
            .map(createParkingCard)
            .join("");

}


/*
 * 주차장 카드 생성
 */
function createParkingCard(parking) {

    const name =
        parking.pkNam || "주차장명 없음";


    const address =
        parking.doroAddr ||
        parking.jibunAddr ||
        "주소 정보 없음";


    const total =
        parseNumber(parking.pkCnt);


    const available =
        parseNumber(parking.currava);


    /*
     * 주차 상태
     */
    const parkingStatus =
        getParkingStatus(
            total,
            available
        );


    /*
     * 데이터 기준일
     */
    const updateDate =
        parking.fnlDt ||
        "정보 없음";


    return `

        <article class="parking-card">

            <div class="parking-card-header">

                <h2 class="parking-name">
                    ${escapeHtml(name)}
                </h2>

                <span class="
                    parking-status
                    ${parkingStatus.className}
                ">
                    ${parkingStatus.icon}
                    ${parkingStatus.text}
                </span>

            </div>


            <div class="parking-address">

                📍
                ${escapeHtml(address)}

            </div>


            <div class="parking-info">


                <div class="parking-info-item">

                    <span class="parking-info-label">
                        전체 주차면
                    </span>

                    <span class="parking-info-value">
                        ${formatNumber(total)}
                        <small>면</small>
                    </span>

                </div>


                <div class="parking-info-item">

                    <span class="parking-info-label">
                        주차 가능
                    </span>

                    <span class="
                        parking-info-value
                        available
                    ">
                        ${formatNumber(available)}
                        <small>면</small>
                    </span>

                </div>


                <div class="parking-info-item">

                    <span class="parking-info-label">
                        이용률
                    </span>

                    <span class="parking-info-value">

                        ${getOccupancyRate(
        total,
        available
    )}

                    </span>

                </div>


            </div>


            <div class="parking-footer">

                데이터 기준:
                ${escapeHtml(updateDate)}

            </div>

        </article>

    `;

}


/*
 * 주차 상태 계산
 */
function getParkingStatus(
    total,
    available
) {

    /*
     * 전체 주차면 정보가 없는 경우
     */
    if (
        total <= 0 ||
        available < 0
    ) {

        return {

            text: "정보 없음",
            className: "status-unknown",
            icon: "⚪"

        };

    }


    /*
     * 남은 주차면 비율
     */
    const ratio =
        available / total;


    /*
     * 30% 이상
     */
    if (ratio >= 0.3) {

        return {

            text: "여유",
            className: "status-good",
            icon: "🟢"

        };

    }


    /*
     * 10% 이상
     */
    if (ratio >= 0.1) {

        return {

            text: "보통",
            className: "status-normal",
            icon: "🟡"

        };

    }


    /*
     * 10% 미만
     */
    return {

        text: "혼잡",
        className: "status-busy",
        icon: "🔴"

    };

}


/*
 * 이용률 계산
 */
function getOccupancyRate(
    total,
    available
) {

    if (
        total <= 0 ||
        available < 0
    ) {

        return "-";

    }


    const occupied =
        total - available;


    const rate =
        Math.round(
            (occupied / total) * 100
        );


    return `${rate}%`;

}


/*
 * 숫자 변환
 */
function parseNumber(value) {

    const number =
        Number(
            String(value ?? "")
                .replace(/,/g, "")
                .trim()
        );


    return Number.isFinite(number)
        ? number
        : 0;

}


/*
 * 숫자 표시
 */
function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(value)
    ) {

        return "-";

    }


    return value.toLocaleString("ko-KR");

}


/*
 * HTML 출력 시 XSS 방지
 */
function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}