let initialDataStore = {
    RoomTypes: [],
    RoomDiscounts: null, // 儲存單一物件，內含 id, startDate...
    RoomCostEveryNights: [],
    RoomCosts: []
};


// --- A. 從後端抓取資料並產生 Checkbox ---
function loadExtraServices() {
    // 儲存來自 AJAX 的完整物件

    $.ajax({
        url: 'https://mycathotelrepo.onrender.com/queryRoomPrice', 
        type: 'POST',
        dataType: 'json',
        success: function (data) {
            const $list = $('#extra-services-list');
            $list.empty(); // 清除載入中文字
            $.each(data.roomCosts, function (i, item) {
                const html = `
                        <label class="service-item">
                            <input type="checkbox" class="extra-check" 
                                    data-name="${item.costName}" 
                                    data-price="${item.costPrice}" value="${item.id}">
                            <span style="margin-left:10px;">${item.costName}</span>
                            <span class="service-price">$${item.costPrice}</span>
                        </label>
                        `;
                $list.append(html);
            });
            $.each(data.roomCostEveryNights, function (i, item) {
                const html = `
                        <label class="service-item2">
                            <input type="checkbox" class="extra-check" 
                                    data-name="${item.costName}" 
                                    data-price="${item.costPrice}" value="${item.id}">
                            <span style="margin-left:10px;">${item.costName}</span>
                            <span class="service-price">$${item.costPrice}</span>
                        </label>
                        `;
                $list.append(html);
            });

            // 後台
            if (data) {
                initialDataStore.RoomTypes = data.roomTypes;
                fillRoomTypes(initialDataStore.RoomTypes);
                
                initialDataStore.RoomDiscounts = data.roomDiscountsLists[0];
                renderRoomDiscounts(initialDataStore.RoomDiscounts);

                initialDataStore.RoomCostEveryNights = data.roomCostEveryNights;
                initialDataStore.RoomCosts = data.roomCosts

                renderAdminGrid('nightly-grid', initialDataStore.RoomCostEveryNights);
                renderAdminGrid('final-grid', initialDataStore.RoomCosts);

            }

            
        },
        error: function () {
            $('#extra-services-list').html('<p>無法載入項目</p>');
        }
    });

    

}


/**
 * 填入第一區塊的靜態欄位 (根據 roomName 對應，並儲存 ID)
*/
function fillRoomTypes(list) {
    // list 包含物件: { id, roomName, roomPrice, totalRoomCount, catLimit, freeCatQuota }
    $.each(list, function (i, room) {
        // 計算系統
        const $cal = $(`.sub-item[data-room-name="${room.roomName}"]`);
        if ($cal.length > 0) {
            $cal.find('.price-box').val(room.roomPrice);
            $cal.find('.totalRoomCount').val(room.totalRoomCount);
            $cal.find('.freeCatQuota').val(room.freeCatQuota);
            $cal.find('.cat-count').attr('MAX', room.catLimit);
        }

        // 後台系統 尋找對應名稱的卡片
        const $card = $(`.room-item-card[data-room-name="${room.roomName}"]`);

        if ($card.length > 0) {
            // 儲存資料庫 ID 到卡片的 data-id
            $card.attr('data-id', room.id || "");

            // 填入對應的 input 數值
            $card.find('.room-types-edit-price').val(room.roomPrice);
            $card.find('.room-types-edit-total').val(room.totalRoomCount);
            $card.find('.room-types-edit-max').val(room.catLimit);
            $card.find('.room-types-edit-threshold').val(room.freeCatQuota);
        }
    });
}



// 區塊2 渲染房型折扣資料
function renderRoomDiscounts(data) {
    if (!data) return;
    const form = document.getElementById('room-discounts-form');
    form.dataset.uid = data.id; // 存入單一 ID

    document.getElementById('start-date').value = data.startDate;
    document.getElementById('end-date').value = data.endDate;
    document.getElementById('extra-cat-fee').value = data.extraCatFee;

    // 批量渲染天數折扣
    document.querySelectorAll('.night-discount').forEach(input => {
        const key = input.dataset.key;
        if (data[key] !== undefined) {
            input.value = data[key];
        }
    });

}

/**
* 渲染 Grid 佈局（每筆含 Checkbox, Name Input, Price Input）
*/
function renderAdminGrid(containerId, dataList) {

    const $container = $('#' + containerId);
    $container.empty();

    if (!dataList || dataList.length === 0) {
        $container.append('<div style="grid-column: 1 / -1; text-align:center; color:#9ca3af; padding: 1rem;">暫無資料</div>');
        return;
    }

    $.each(dataList, function (i, item) {
        const html = `
                    <div class="item-row" data-id="${item.id}">
                        <input type="checkbox" class="row-check" value="${item.id}">
                        <input type="text" class="admin-edit-input edit-name" value="${item.costName}" placeholder="項目名稱">
                        <div class="edit-price-wrapper">
                            <span>$</span>
                            <input type="number" class="admin-edit-input edit-price" value="${item.costPrice}" placeholder="0">
                        </div>
                    </div>
                `;
        $container.append(html);
    });

}

function resetData(target) {
    if (target === 'RoomDiscounts' && initialDataStore.RoomDiscounts) {
        renderRoomDiscounts(initialDataStore.RoomDiscounts);
        showToast("資料已重置為初始狀態");
    } else if (target === 'RoomTypes' && initialDataStore.RoomTypes ){
        fillRoomTypes(initialDataStore.RoomTypes);
        showToast("資料已重置為初始狀態");
    } else {
        showToast(`重置 ${target} (開發中)`);
    }
}

/**
* 處理新增/修改/刪除動作
*/
window.handleAction = function (action, target) {
    const actionMap = { 'create': '+新增', 'update': '修改', 'delete': '刪除' };
    const titleMap = {
        'RoomTypes': '房型資料',
        'RoomDiscounts': '房型折扣',
        'RoomCostEveryNights': '每晚折抵',
        'RoomCost': '最後折抵'
    };

    //區塊 1 的修改
    if (action === 'update' && target === 'RoomTypes') {
        const payload = [];
        $('.room-item-card').each(function () {
            const $card = $(this);
            const id = $card.attr('data-id');

            payload.push({
                id: id ? id : null, // 包含 ID
                roomName: $card.attr('data-room-name'),
                roomPrice: $card.find('.room-types-edit-price').val() || 0,
                totalRoomCount: $card.find('.room-types-edit-total').val() || 0,
                catLimit: $card.find('.room-types-edit-max').val() || 0,
                freeCatQuota: $card.find('.room-types-edit-threshold').val() || 0
            });
        });
        console.log(payload);
        
        $.ajax({
            url: 'https://mycathotelrepo.onrender.com/patchRoomTypes',
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (responseList) { 
                if (responseList && Array.isArray(responseList) && responseList.length > 0){
                    // 更新全域快照
                    initialDataStore.RoomTypes = responseList;
                    // 重新渲染該區塊
                    fillRoomTypes(initialDataStore.RoomTypes);
                    showToast(`修改成功！${titleMap.RoomTypes} 已同步`);
                } else {
                    showToast("修改成功，但回傳資料格式不正確");
                }
            },
            error: function () { showToast("儲存失敗，請檢查後端連線"); }
        });
        
    }

    // 區塊 2 的修改邏輯
    if (action === 'update' && target === 'RoomDiscounts') {
        const form = document.getElementById('room-discounts-form');
        const currentId = form.dataset.uid;

        // 收集表單數值
        const singleObject = {
            id: currentId,
            startDate: document.getElementById('start-date').value,
            endDate: document.getElementById('end-date').value,
            extraCatFee: parseInt(document.getElementById('extra-cat-fee').value, 10) || 0
        };

        // 動態收集長住折扣天數
        document.querySelectorAll('.night-discount').forEach(input => {
            singleObject[input.dataset.key] = parseInt(input.value, 10) || 0;
        });

        // 包裝成 List<RoomDiscountsList> 格式
        const payload = [singleObject];

        // 執行 PATCH 請求
        $.ajax({
            url: 'https://mycathotelrepo.onrender.com/patchDiscountsList',
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            dataType: 'json',
            success: function (responseList) {
                // 後端回傳是 List<RoomDiscountsList>，取第一筆
                if (responseList && Array.isArray(responseList) && responseList.length > 0) {
                    const updatedData = responseList[0];

                    // 更新全域快照
                    initialDataStore.RoomDiscounts = updatedData;

                    // 重新渲染該區塊
                    renderRoomDiscounts(updatedData);

                    showToast(`修改成功！${titleMap.RoomDiscounts} 已同步`);
                } else {
                    showToast("修改成功，但回傳資料格式不正確");
                }
            },
            error: function (xhr) {
                console.error("修改失敗:", xhr);
                showToast(`修改失敗: ${xhr.status} ${xhr.statusText}`);
            }
        });
        return;
    }

    // 其他區塊提示
    showToast(`[${actionMap[action]}] ${titleMap[target]} 功能開發中`);
};

// 開啟新增彈窗
function showAddRow(target) {
    currentTargetSection = target;
    const title = target === 'RoomCostEveryNights' ? '新增每晚折抵項目' : '新增最後折抵項目';
    $('#modal-title-text').text(title);
    $('#new-cost-name').val('');
    $('#new-cost-price').val('0');
    $('#add-modal').removeClass('hidden');

    // 綁定確認按鈕事件 (先解除舊綁定防止重複執行)
    $('#modal-confirm-btn').off('click').on('click', confirmAddRow);
}

function closeModal() {
    $('#add-modal').addClass('hidden');
}

/**
* 區塊3、4執行 AJAX 新增動作
*/
function confirmAddRow() {
    const name = $('#new-cost-name').val().trim();
    const price = $('#new-cost-price').val() || 0;

    if (!name) {
        showToast("請輸入項目名稱");
        return;
    }

    // 判斷 API 網址與對應的 Grid ID
    let apiUrl = '';
    let gridId = '';

    if (currentTargetSection === 'RoomCostEveryNights') {
        apiUrl = 'https://mycathotelrepo.onrender.com/insertRoomCostEveryNight';
        gridId = 'nightly-grid';
    } else {
        apiUrl = 'https://mycathotelrepo.onrender.com/insertRoomCost';
        gridId = 'final-grid';
    }

    // 包裝成 List (Array) 傳送至後端
    const payload = [{
        costName: name,
        costPrice: price
    }];

    showToast("正在提交新增...");

    $.ajax({
        url: apiUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (responseList) {
            // 成功後，後端通常會回傳最新完整的 List，直接重新渲染
            
            renderAdminGrid(gridId, responseList);
            reloadcost();
            showToast("新增成功！");
            closeModal();
        },
        error: function (xhr) {
            console.error("Insert Error:", xhr);
            showToast("新增失敗，請確認後端服務是否正常");
        }
    });

    
}

/**
 * 執行 AJAX 批量刪除
 * 功能：打包被勾選的 ID 成 List 傳送到後端
 */
function batchDelete(target) {
    const gridId = (target === 'RoomCostEveryNights') ? 'nightly-grid' : 'final-grid';
    const apiUrl = (target === 'RoomCostEveryNights') ? 'https://mycathotelrepo.onrender.com/deleteRoomCostEveryNight' : 'https://mycathotelrepo.onrender.com/deleteRoomCost';

    // 1. 收集被勾選的 ID
    const selectedIds = [];
    $(`#${gridId} .row-check:checked`).each(function () {
        selectedIds.push($(this).val());
    });

    if (selectedIds.length === 0) {
        showToast("請先勾選要刪除的項目");
        return;
    }

    if (confirm(`確定要刪除這 ${selectedIds.length} 筆資料嗎？`)) {
        showToast("正在執行刪除...");

        $.ajax({
            url: apiUrl,
            type: 'DELETE',
            contentType: 'application/json',
            data: JSON.stringify(selectedIds), // 發送 ID 的 List
            success: function (responseList) {
                // 刪除成功後，後端回傳剩餘的完整 List，重新渲染
                renderAdminGrid(gridId, responseList);
                reloadcost();
                showToast("刪除成功！");
            },
            error: function (xhr) {
                console.error("Delete Error:", xhr);
                showToast("刪除失敗，請確認後端服務是否正常");
            }
        });
    }
}

function reloadcost(){
    $.ajax({
        url: 'https://mycathotelrepo.onrender.com/queryRoomPrice', 
        type: 'POST',
        dataType: 'json',
        success: function (data) {
            const $list = $('#extra-services-list');
            $list.empty(); // 清除載入中文字
            $.each(data.roomCosts, function (i, item) {
                const html = `
                        <label class="service-item">
                            <input type="checkbox" class="extra-check" 
                                    data-name="${item.costName}" 
                                    data-price="${item.costPrice}" value="${item.id}">
                            <span style="margin-left:10px;">${item.costName}</span>
                            <span class="service-price">$${item.costPrice}</span>
                        </label>
                        `;
                $list.append(html);
            });
            $.each(data.roomCostEveryNights, function (i, item) {
                const html = `
                        <label class="service-item2">
                            <input type="checkbox" class="extra-check" 
                                    data-name="${item.costName}" 
                                    data-price="${item.costPrice}" value="${item.id}">
                            <span style="margin-left:10px;">${item.costName}</span>
                            <span class="service-price">$${item.costPrice}</span>
                        </label>
                        `;
                $list.append(html);
            });
        },
        error: function () {
            $('#extra-services-list').html('<p>無法載入項目</p>');
        }
    });
}


/**
 * 顯示訊息提示
 */
function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    toastMsg.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.remove('translate-y-10'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-10');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2500);
}

loadExtraServices(); // 頁面載入後執行
