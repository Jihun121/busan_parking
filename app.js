const loadButton = document.getElementById("loadButton");
const status = document.getElementById("status");
const parkingList = document.getElementById("parkingList");

const searchInput = document.getElementById("searchInput");
const districtSelect = document.getElementById("districtSelect");
const statusSelect = document.getElementById("statusSelect");
const resultCount = document.getElementById("resultCount");

let parkingData = [];


/* ==============================
   이벤트
============================== */

loadButton.addEventListener("click", loadParking);

searchInput.addEventListener("input", renderParking);

districtSelect.addEventListener("change", renderParking);

statusSelect.addEventListener("change", renderParking);


/* ==============================
   주차장 정보 불러오기
============================== */

async function loadParking() {

    loadButton.disabled = true;

    status.textContent =
        "주차장 정보를 불러오는 중...";

    parkingList.innerHTML = `
        <div class="empty">
            데이터를 불러오는 중입니다...
        </div>
    `;

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


        /* ==============================
           API 데이터 추출
        ============================== */

        parkingData =
            data.response?.body?.items?.item ?? [];


        /*
         * 데이터가 한 건일 경우
         * 배열이 아닐 수 있으므로 배열로 변환
         */

        if (!Array.isArray(parkingData)) {

            parkingData = [
                parkingData
            ];

        }


        console.log(
            "주차장 데이터:",
            parkingData
        );

        console.log(
            "주차장 개수:",
            parkingData.length
        );


        /* ==============================
           지역 목록 생성
        ============================== */

        createDistrictOptions();


        /* ==============================
           화면 표시
        ============================== */

        renderParking();

        loadParkingMarkers();

        status.textContent =
            "조회 성공";

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

        resultCount.textContent =
            "검색 결과 0개";

    }
    finally {

        loadButton.disabled = false;

    }

}


/* ==============================
   지역 선택 목록 생성
============================== */

function createDistrictOptions() {

    const districts =
        new Set();


    parkingData.forEach(parking => {

        /*
         * 부산 공영주차장 API의
         * 구/군 정보
         */
        const district =
            String(
                parking.guNm || ""
            ).trim();


        if (district) {

            districts.add(
                district
            );

        }

    });


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


    console.log(
        "지역 목록:",
        sortedDistricts
    );

}


/* ==============================
   필터 적용
============================== */

function getFilteredParking() {

    const searchKeyword =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedDistrict =
        districtSelect.value;


    const selectedStatus =
        statusSelect.value;


    return parkingData.filter(
        parking => {


            /* ------------------------------
               검색어
            ------------------------------ */

            const name =
                String(
                    parking.pkNam || ""
                ).toLowerCase();


            const roadAddress =
                String(
                    parking.doroAddr || ""
                ).toLowerCase();


            const jibunAddress =
                String(
                    parking.jibunAddr || ""
                ).toLowerCase();


            const searchMatched =
                !searchKeyword ||
                name.includes(
                    searchKeyword
                ) ||
                roadAddress.includes(
                    searchKeyword
                ) ||
                jibunAddress.includes(
                    searchKeyword
                );


            if (!searchMatched) {

                return false;

            }


            /* ------------------------------
               지역
            ------------------------------ */

            const district =
                String(
                    parking.guNm || ""
                ).trim();


            if (
                selectedDistrict !== "all" &&
                district !== selectedDistrict
            ) {

                return false;

            }


            /* ------------------------------
               주차 상태
            ------------------------------ */

            const parkingStatus =
                getParkingStatus(
                    parking
                );


            if (
                selectedStatus !== "all" &&
                parkingStatus !==
                `status-${selectedStatus}`
            ) {

                return false;

            }


            return true;

        }
    );

}


/* ==============================
   화면 렌더링
============================== */

function renderParking() {

    const filteredParking =
        getFilteredParking();


    resultCount.textContent =
        `검색 결과 ${filteredParking.length}개`;


    if (
        filteredParking.length === 0
    ) {

        parkingList.innerHTML = `
            <div class="empty">
                조건에 맞는 주차장이 없습니다.
            </div>
        `;

        return;

    }


    parkingList.innerHTML =
        filteredParking
            .map(
                parking =>
                    createParkingCard(
                        parking
                    )
            )
            .join("");

}


/* ==============================
   주차장 카드
============================== */

function createParkingCard(
    parking
) {

    const name =
        parking.pkNam ||
        "주차장명 없음";


    const roadAddress =
        parking.doroAddr ||
        "";


    const jibunAddress =
        parking.jibunAddr ||
        "";


    const address =
        roadAddress ||
        jibunAddress ||
        "주소 정보 없음";


    const total =
        parseNumber(
            parking.pkCnt
        );


    const available =
        parseNumber(
            parking.currava
        );


    const occupancyRate =
        total > 0
            ? Math.round(
                (
                    (total - available) /
                    total
                ) * 100
            )
            : 0;


    const parkingStatus =
        getParkingStatus(
            parking
        );


    const statusText =
        getParkingStatusText(
            parkingStatus
        );


    const updateTime =
        parking.fnlDt ||
        "정보 없음";


    return `
        <article class="parking-card">

            <div class="card-header">

                <h2>
                    ${escapeHtml(name)}
                </h2>

                <span class="parking-status ${parkingStatus}">
                    ${statusText}
                </span>

            </div>


            <div class="address">

                📍
                ${escapeHtml(address)}

            </div>


            <div class="parking-info">

                <div class="info-item">

                    <span class="info-label">
                        전체 주차면
                    </span>

                    <strong>
                        ${formatNumber(total)}면
                    </strong>

                </div>


                <div class="info-item">

                    <span class="info-label">
                        현재 주차 가능
                    </span>

                    <strong>
                        ${formatNumber(available)}면
                    </strong>

                </div>


                <div class="info-item">

                    <span class="info-label">
                        이용률
                    </span>

                    <strong>
                        ${occupancyRate}%
                    </strong>

                </div>

            </div>


            <div class="occupancy-bar">

                <div
                    class="occupancy-progress"
                    style="width: ${occupancyRate}%"
                ></div>

            </div>


            <div class="card-footer">

                <span>
                    🕐 업데이트:
                    ${escapeHtml(updateTime)}
                </span>

            </div>

        </article>
    `;

}


/* ==============================
   주차 상태 계산
============================== */

function getParkingStatus(
    parking
) {

    const total =
        parseNumber(
            parking.pkCnt
        );


    const available =
        parseNumber(
            parking.currava
        );


    if (total <= 0) {

        return "status-unknown";

    }


    const rate =
        available / total;


    if (rate >= 0.5) {

        return "status-good";

    }


    if (rate >= 0.2) {

        return "status-normal";

    }


    return "status-busy";

}


/* ==============================
   상태 표시 문자
============================== */

function getParkingStatusText(
    parkingStatus
) {

    switch (parkingStatus) {

        case "status-good":

            return "🟢 여유";


        case "status-normal":

            return "🟡 보통";


        case "status-busy":

            return "🔴 혼잡";


        default:

            return "⚪ 정보 없음";

    }

}


/* ==============================
   숫자 변환
============================== */

function parseNumber(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    const number =
        Number(
            String(value)
                .replaceAll(",", "")
                .trim()
        );


    return Number.isFinite(number)
        ? number
        : 0;

}


/* ==============================
   숫자 표시
============================== */

function formatNumber(
    value
) {

    return Number(
        value || 0
    ).toLocaleString("ko-KR");

}


/* ==============================
   HTML escape
============================== */

function escapeHtml(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}

/* ==============================
   카카오맵
============================== */

let kakaoMap = null;

function initKakaoMap() {

    const mapContainer =
        document.getElementById("map");

    if (!mapContainer) {
        return;
    }

    const mapOption = {
        center: new kakao.maps.LatLng(
            35.1796,
            129.0756
        ),
        level: 8
    };

    kakaoMap =
        new kakao.maps.Map(
            mapContainer,
            mapOption
        );

}

window.addEventListener(
    "load",
    () => {

        if (
            typeof kakao === "undefined" ||
            !kakao.maps
        ) {

            console.error(
                "카카오맵 SDK가 로드되지 않았습니다."
            );

            return;
        }

        initKakaoMap();

    }
);

/* ==============================
   주차장 테스트 마커
============================== */

async function testParkingMarker() {

    if (!parkingData.length) {
        console.log("주차장 데이터가 없습니다.");
        return;
    }

    const parking = parkingData[0];

    const roadAddress =
        String(parking.doroAddr || "").trim();

    const jibunAddress =
        String(parking.jibunAddr || "").trim();

    const validRoadAddress =
        roadAddress !== "-" &&
        roadAddress !== "";

    const validJibunAddress =
        jibunAddress !== "-" &&
        jibunAddress !== "";

    const address =
        validRoadAddress
            ? roadAddress
            : validJibunAddress
                ? jibunAddress
                : "";

    console.log("===== 테스트 주차장 =====");
    console.log("주차장명:", parking.pkNam);
    console.log("도로명 주소:", roadAddress);
    console.log("지번 주소:", jibunAddress);
    console.log("사용할 주소:", address);

    if (!address) {
        console.log("주소가 없습니다.");
        return;
    }

    try {

        const response =
            await fetch(
                `/api/geocode?address=${encodeURIComponent(address)}`
            );

        if (!response.ok) {
            throw new Error(
                `Geocode HTTP 오류: ${response.status}`
            );
        }

        const data =
            await response.json();

        console.log("좌표 변환 결과:", data);

        if (
            !data.documents ||
            data.documents.length === 0
        ) {
            console.log(
                "해당 주차장의 좌표를 찾지 못했습니다."
            );

            console.log(
                "Kakao Geocode 전체 응답:",
                data
            );

            return;
        }

        const document =
            data.documents[0];

        const x =
            Number(document.x);

        const y =
            Number(document.y);

        console.log("X:", x);
        console.log("Y:", y);

        const position =
            new kakao.maps.LatLng(
                y,
                x
            );

        const marker =
            new kakao.maps.Marker({
                position: position,
                map: kakaoMap
            });

        kakaoMap.setCenter(position);

        const infoWindow =
            new kakao.maps.InfoWindow({
                content: `
                    <div style="
                        padding:10px;
                        font-size:14px;
                        white-space:nowrap;
                    ">
                        ${escapeHtml(
                    parking.pkNam ||
                    "주차장"
                )}
                    </div>
                `
            });

        kakao.maps.event.addListener(
            marker,
            "click",
            () => {

                infoWindow.open(
                    kakaoMap,
                    marker
                );

            }
        );

        console.log(
            "주차장 테스트 마커 표시 성공"
        );

    }
    catch (error) {

        console.error(
            "주차장 마커 생성 실패:",
            error
        );

    }
}

/* ==============================
   여러 주차장 마커
============================== */

let parkingMarkers = [];
const geocodeCache = new Map();
let markerStats = {
    total: 0,
    success: 0,
    noAddress: 0,
    noResult: 0,
    invalidCoordinate: 0,
    apiError: 0
};

async function geocodeAddress(address) {

    // 캐시에 있는 경우
    if (geocodeCache.has(address)) {
        return geocodeCache.get(address);
    }

    try {

        const response =
            await fetch(
                `/api/geocode?address=${encodeURIComponent(address)}`
            );

        if (!response.ok) {

            console.log(
                "Geocode HTTP 오류:",
                response.status,
                address
            );

            const result = {
                success: false,
                reason: "apiError"
            };

            geocodeCache.set(
                address,
                result
            );

            return result;
        }

        const data =
            await response.json();

        if (
            !data.documents ||
            data.documents.length === 0
        ) {

            console.log(
                "좌표 없음:",
                address
            );

            const result = {
                success: false,
                reason: "noResult"
            };

            geocodeCache.set(
                address,
                result
            );

            return result;
        }

        const document =
            data.documents[0];

        const x =
            Number(document.x);

        const y =
            Number(document.y);

        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y)
        ) {

            const result = {
                success: false,
                reason: "invalidCoordinate"
            };

            geocodeCache.set(
                address,
                result
            );

            return result;
        }

        const result = {
            success: true,
            x: x,
            y: y
        };

        geocodeCache.set(
            address,
            result
        );

        return result;

    }
    catch (error) {

        console.error(
            "Geocode 오류:",
            address,
            error
        );

        const result = {
            success: false,
            reason: "apiError"
        };

        geocodeCache.set(
            address,
            result
        );

        return result;
    }
}

async function loadParkingMarkers() {

    markerStats = {
        total: parkingData.length,
        success: 0,
        noAddress: 0,
        noResult: 0,
        invalidCoordinate: 0,
        apiError: 0
    };

    if (!kakaoMap) {
        console.log("카카오 지도가 아직 준비되지 않았습니다.");
        return;
    }

    if (!parkingData.length) {
        console.log("주차장 데이터가 없습니다.");
        return;
    }

    console.log(
        `주차장 마커 생성 시작: ${parkingData.length}개`
    );

    // 기존 마커 제거
    clearParkingMarkers();

    const targetParking =
        parkingData;

    const bounds =
        new kakao.maps.LatLngBounds();

    let successCount = 0;

    for (const parking of targetParking) {

        const roadAddress =
            String(
                parking.doroAddr || ""
            ).trim();

        const jibunAddress =
            String(
                parking.jibunAddr || ""
            ).trim();

        // "-" 또는 빈 주소 제외
        const validRoadAddress =
            roadAddress &&
            roadAddress !== "-";

        const validJibunAddress =
            jibunAddress &&
            jibunAddress !== "-";

        const address =
            validRoadAddress
                ? roadAddress
                : validJibunAddress
                    ? jibunAddress
                    : "";

        if (!address) {

            console.log(
                "주소 없음:",
                parking.pkNam
            );

            markerStats.noAddress++;

            continue;
        }

        try {

            const coordinate =
                await geocodeAddress(address);

            if (!coordinate.success) {

                if (
                    coordinate.reason ===
                    "noResult"
                ) {

                    markerStats.noResult++;

                }
                else if (
                    coordinate.reason ===
                    "invalidCoordinate"
                ) {

                    markerStats.invalidCoordinate++;

                }
                else if (
                    coordinate.reason ===
                    "apiError"
                ) {

                    markerStats.apiError++;

                }

                console.log(
                    "좌표 변환 실패:",
                    parking.pkNam,
                    address,
                    coordinate.reason
                );

                continue;
            }

            const x =
                coordinate.x;

            const y =
                coordinate.y;

            const position =
                new kakao.maps.LatLng(
                    y,
                    x
                );

            const marker =
                new kakao.maps.Marker({
                    position: position,
                    map: kakaoMap
                });

            parkingMarkers.push(marker);

            bounds.extend(position);

            markerStats.success++;

            successCount++;

            /*
             * 마커 클릭 정보
             */
            const name =
                parking.pkNam ||
                "주차장명 없음";

            const total =
                parseNumber(
                    parking.pkCnt
                );

            const available =
                parseNumber(
                    parking.currava
                );

            const parkingStatus =
                getParkingStatus(parking);

            const statusText =
                getParkingStatusText(
                    parkingStatus
                );

            const infoWindow =
                new kakao.maps.InfoWindow({
                    content: `
                        <div style="
                            padding:12px;
                            font-size:13px;
                            line-height:1.6;
                            min-width:180px;
                        ">
                            <strong>
                                ${escapeHtml(name)}
                            </strong>

                            <br>

                            📍
                            ${escapeHtml(address)}

                            <br>

                            🅿️
                            전체 ${formatNumber(total)}면

                            <br>

                            🚗
                            현재 ${formatNumber(available)}면

                            <br>

                            ${statusText}
                        </div>
                    `
                });

            kakao.maps.event.addListener(
                marker,
                "click",
                () => {

                    infoWindow.open(
                        kakaoMap,
                        marker
                    );

                }
            );

            console.log(
                `마커 생성 성공: ${name}`
            );

        }
        catch (error) {

            console.error(
                "마커 생성 오류:",
                parking.pkNam,
                error
            );

        }
    }

    /*
     * 마커가 하나라도 있으면
     * 전체 마커가 보이도록 지도 이동
     */
    if (successCount > 0) {

        kakaoMap.setBounds(
            bounds
        );

    }

    console.log(
        `마커 생성 완료: ${successCount}개`
    );

    renderMarkerStats();
}


/*
 * 기존 마커 제거
 */
function clearParkingMarkers() {

    parkingMarkers.forEach(
        marker => {
            marker.setMap(null);
        }
    );

    parkingMarkers = [];
}

function renderMarkerStats() {

    const container =
        document.getElementById(
            "markerStats"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="marker-stats-title">
            📊 지도 마커 처리 결과
        </div>

        <div class="marker-stats-grid">

            <div class="marker-stat-item">
                <span class="marker-stat-label">
                    전체 주차장
                </span>
                <strong class="marker-stat-value">
                    ${markerStats.total}
                </strong>
            </div>

            <div class="marker-stat-item">
                <span class="marker-stat-label">
                    📍 마커 생성
                </span>
                <strong class="marker-stat-value">
                    ${markerStats.success}
                </strong>
            </div>

            <div class="marker-stat-item">
                <span class="marker-stat-label">
                    주소 없음
                </span>
                <strong class="marker-stat-value">
                    ${markerStats.noAddress}
                </strong>
            </div>

            <div class="marker-stat-item">
                <span class="marker-stat-label">
                    Kakao 검색 실패
                </span>
                <strong class="marker-stat-value">
                    ${markerStats.noResult}
                </strong>
            </div>

            <div class="marker-stat-item">
                <span class="marker-stat-label">
                    API/기타 오류
                </span>
                <strong class="marker-stat-value">
                    ${markerStats.apiError +
        markerStats.invalidCoordinate}
                </strong>
            </div>

        </div>
    `;
}