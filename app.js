const loadButton =
    document.getElementById("loadButton");

const status =
    document.getElementById("status");

const parkingList =
    document.getElementById("parkingList");

const searchInput =
    document.getElementById("searchInput");

const districtSelect =
    document.getElementById("districtSelect");

const statusSelect =
    document.getElementById("statusSelect");

const resultCount =
    document.getElementById("resultCount");


let parkingData = [];


/*
 * 주차장 정보 조회
 */
loadButton.addEventListener(
    "click",
    loadParking
);


/*
 * 검색
 */
searchInput.addEventListener(
    "input",
    renderParkingList
);


/*
 * 지역 필터
 */
districtSelect.addEventListener(
    "change",
    renderParkingList
);


/*
 * 상태 필터
 */
statusSelect.addEventListener(
    "change",
    renderParkingList
);


/*
 * 주차장 데이터 조회
 */
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


        parkingData =
            data.response?.body?.items?.item ?? [];


        if (!Array.isArray(parkingData)) {

            parkingData =
                [parkingData];

        }


        /*
         * 지역 목록 생성
         */
        createDistrictOptions();


        /*
         * 목록 출력
         */
        renderParkingList();


        status.textContent =
            `전체 ${parkingData.length}개 주차장`;

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


        resultCount.textContent =
            "검색 결과 0개";

    }
    finally {

        loadButton.disabled = false;

    }

}


/*
 * 구/군 목록 생성
 */
function createDistrictOptions() {

    const districts =
        new Set();


    parkingData.forEach(
        parking => {

            const address =
                parking.doroAddr ||
                parking.jibunAddr ||
                "";


            const district =
                extractDistrict(address);


            if (district) {

                districts.add(district);

            }

        }
    );


    const sortedDistricts =
        [...districts].sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "ko"
                )
        );


    districtSelect.innerHTML = `

        <option value="all">
            전체 지역
        </option>

    `;


    sortedDistricts.forEach(
        district => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                district;

            option.textContent =
                district;


            districtSelect.appendChild(
                option
            );

        }
    );

}


/*
 * 주소에서 구/군 추출
 *
 * 부산광역시 중구 ...
 * 부산광역시 해운대구 ...
 *
 * → 중구
 * → 해운대구
 */
function extractDistrict(address) {

    const match =
        String(address).match(
            /부산광역시\s+([가-힣]+(?:구|군))/
        );


    return match
        ? match[1]
        : "";

}


/*
 * 주차장 목록 출력
 */
function renderParkingList() {

    const filteredData =
        getFilteredParking();


    resultCount.textContent =
        `검색 결과 ${filteredData.length}개`;


    if (filteredData.length === 0) {

        parkingList.innerHTML = `

            <div class="empty">

                조건에 맞는 주차장이 없습니다.

            </div>

        `;

        return;

    }


    parkingList.innerHTML =
        filteredData
            .map(createParkingCard)
            .join("");

}


/*
 * 필터 적용
 */
function getFilteredParking() {

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedDistrict =
        districtSelect.value;


    const selectedStatus =
        statusSelect.value;


    return parkingData.filter(
        parking => {

            const name =
                parking.pkNam || "";


            const address =
                parking.doroAddr ||
                parking.jibunAddr ||
                "";


            /*
             * 검색
             */
            const matchesKeyword =
                !keyword ||
                name
                    .toLowerCase()
                    .includes(keyword) ||
                address
                    .toLowerCase()
                    .includes(keyword);


            if (!matchesKeyword) {

                return false;

            }


            /*
             * 지역
             */
            const district =
                extractDistrict(address);


            if (
                selectedDistrict !== "all" &&
                district !== selectedDistrict
            ) {

                return false;

            }


            /*
             * 상태
             */
            const total =
                parseNumber(
                    parking.pkCnt
                );


            const available =
                parseNumber(
                    parking.currava
                );


            const parkingStatus =
                getParkingStatus(
                    total,
                    available
                );


            if (
                selectedStatus !== "all" &&
                parkingStatus.className !==
                `status-${selectedStatus}`
            ) {

                return false;

            }


            return true;

        }
    );

}


/*
 * 카드 생성
 */
function createParkingCard(parking) {

    const name =
        parking.pkNam ||
        "주차장명 없음";


    const address =
        parking.doroAddr ||
        parking.jibunAddr ||
        "주소 정보 없음";


    const total =
        parseNumber(
            parking.pkCnt
        );


    const available =
        parseNumber(
            parking.currava
        );


    const parkingStatus =
        getParkingStatus(
            total,
            available
        );


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
 * 주차 상태
 */
function getParkingStatus(
    total,
    available
) {

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


    const ratio =
        available / total;


    if (ratio >= 0.3) {

        return {

            text: "여유",
            className: "status-good",
            icon: "🟢"

        };

    }


    if (ratio >= 0.1) {

        return {

            text: "보통",
            className: "status-normal",
            icon: "🟡"

        };

    }


    return {

        text: "혼잡",
        className: "status-busy",
        icon: "🔴"

    };

}


/*
 * 이용률
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
        Math.max(
            0,
            total - available
        );


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
        !Number.isFinite(value)
    ) {

        return "-";

    }


    return value.toLocaleString(
        "ko-KR"
    );

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