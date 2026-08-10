/* =========================================================
   Event & Parking Reservation System
   Admin Category Management
   ========================================================= */


let adminCategories = [];

let categorySaveInProgress = false;

let categoryDeleteInProgress = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdminCategoriesPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminCategoriesPage() {

    if (!validateAdminCategoryAccess()) {
        return;
    }


    await loadCategoryAdminSidebar();


    initializeCategoryControls();


    await loadAdminCategories();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateAdminCategoryAccess() {

    const token =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.TOKEN
        );


    const role =
        String(
            localStorage.getItem(
                APP_CONFIG.STORAGE_KEYS.ROLE
            ) || ""
        )
            .trim()
            .toLowerCase();


    if (!token) {

        window.location.href =
            "../auth/login.html";

        return false;
    }


    if (
        role !== "admin" &&
        role !== "administrator"
    ) {

        window.location.href =
            "../auth/login.html";

        return false;
    }


    return true;
}


/* =========================================================
   SIDEBAR
   ========================================================= */

async function loadCategoryAdminSidebar() {

    await loadComponent(
        "adminSidebarContainer",
        "components/admin-sidebar.html"
    );


    document
        .querySelectorAll(
            "[data-admin-page]"
        )
        .forEach(
            function (link) {

                link.classList.remove(
                    "active"
                );


                if (
                    link.dataset.adminPage ===
                    "categories"
                ) {

                    link.classList.add(
                        "active"
                    );
                }
            }
        );


    initializeCategoryAdminLogout();
}


/* =========================================================
   LOGOUT
   ========================================================= */

function initializeCategoryAdminLogout() {

    const button =
        document.getElementById(
            "adminSidebarLogoutButton"
        );


    if (!button) {

        return;
    }


    button.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                APP_CONFIG.STORAGE_KEYS.TOKEN
            );


            localStorage.removeItem(
                APP_CONFIG.STORAGE_KEYS.USER
            );


            localStorage.removeItem(
                APP_CONFIG.STORAGE_KEYS.ROLE
            );


            localStorage.removeItem(
                APP_CONFIG.STORAGE_KEYS.CUSTOMER_ID
            );


            sessionStorage.clear();


            window.location.href =
                "../auth/login.html";
        }
    );
}


/* =========================================================
   CONTROLS
   ========================================================= */

function initializeCategoryControls() {

    const addButton =
        document.getElementById(
            "addCategoryButton"
        );


    const emptyAddButton =
        document.getElementById(
            "emptyAddCategoryButton"
        );


    const closeButton =
        document.getElementById(
            "closeCategoryFormButton"
        );


    const cancelButton =
        document.getElementById(
            "cancelCategoryFormButton"
        );


    const form =
        document.getElementById(
            "categoryForm"
        );


    const search =
        document.getElementById(
            "categorySearchInput"
        );


    const clearSearch =
        document.getElementById(
            "clearCategorySearchButton"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            openAddCategoryModal
        );
    }


    if (emptyAddButton) {

        emptyAddButton.addEventListener(
            "click",
            openAddCategoryModal
        );
    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeCategoryModal
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeCategoryModal
        );
    }


    if (form) {

        form.addEventListener(
            "submit",
            saveCategory
        );
    }


    if (search) {

        search.addEventListener(
            "input",
            applyCategorySearch
        );
    }


    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            function () {

                if (search) {

                    search.value =
                        "";
                }


                applyCategorySearch();
            }
        );
    }


    initializeCategoryModalBackgroundClose();
}


/* =========================================================
   MODAL BACKGROUND
   ========================================================= */

function initializeCategoryModalBackgroundClose() {

    const modal =
        document.getElementById(
            "categoryFormModal"
        );


    if (!modal) {
        return;
    }


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                closeCategoryModal();
            }
        }
    );
}


/* =========================================================
   LOAD CATEGORIES
   ========================================================= */

async function loadAdminCategories() {

    clearCategoryMessage();

    showCategoriesLoading();


    try {

        /*
         * BRD:
         *
         * GET /api/categories
         */

        const response =
            await apiGet(
                "/categories"
            );


        adminCategories =
            normalizeCategoriesResponse(
                response
            );


        sortCategories();


        renderCategorySummary();


        hideCategoriesLoading();


        applyCategorySearch();


    } catch (error) {

        console.error(
            "Categories Load Error:",
            error
        );


        hideCategoriesLoading();


        showCategoryMessage(
            error.message ||
            "Unable to load event categories.",
            "error"
        );
    }
}


/* =========================================================
   NORMALIZE
   ========================================================= */

function normalizeCategoriesResponse(
    response
) {

    if (
        Array.isArray(response)
    ) {

        return response;
    }


    if (
        Array.isArray(
            response?.data
        )
    ) {

        return response.data;
    }


    if (
        Array.isArray(
            response?.items
        )
    ) {

        return response.items;
    }


    if (
        Array.isArray(
            response?.categories
        )
    ) {

        return response.categories;
    }


    return [];
}


/* =========================================================
   SORT
   ========================================================= */

function sortCategories() {

    adminCategories.sort(
        function (a, b) {

            return getCategoryName(a)
                .localeCompare(
                    getCategoryName(b)
                );
        }
    );
}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderCategorySummary() {

    setCategoryText(
        "totalCategoryCount",
        adminCategories.length
    );


    document
        .getElementById(
            "categorySummary"
        )
        ?.classList.remove(
            "hidden"
        );
}


/* =========================================================
   SEARCH
   ========================================================= */

function applyCategorySearch() {

    const search =
        document
            .getElementById(
                "categorySearchInput"
            )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const filtered =
        adminCategories.filter(
            function (category) {

                if (!search) {

                    return true;
                }


                return getCategoryName(
                    category
                )
                    .toLowerCase()
                    .includes(
                        search
                    );
            }
        );


    renderCategories(
        filtered
    );
}


/* =========================================================
   RENDER CATEGORIES
   ========================================================= */

function renderCategories(
    categories
) {

    const grid =
        document.getElementById(
            "categoriesGrid"
        );


    const empty =
        document.getElementById(
            "categoriesEmpty"
        );


    if (
        !grid ||
        !empty
    ) {

        return;
    }


    grid.innerHTML =
        "";


    setCategoryText(
        "categoryResultCount",
        categories.length === 1
            ? "1 category"
            : `${categories.length} categories`
    );


    if (
        categories.length === 0
    ) {

        grid.classList.add(
            "hidden"
        );


        empty.classList.remove(
            "hidden"
        );


        return;
    }


    empty.classList.add(
        "hidden"
    );


    grid.classList.remove(
        "hidden"
    );


    categories.forEach(
        function (category) {

            grid.appendChild(
                createCategoryCard(
                    category
                )
            );
        }
    );
}


/* =========================================================
   CREATE CARD
   ========================================================= */

function createCategoryCard(
    category
) {

    const id =
        getCategoryId(
            category
        );


    const name =
        getCategoryName(
            category
        );


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "admin-category-card";


    card.innerHTML = `

        <div class="admin-category-card-top">

            <div class="admin-category-icon">
                #
            </div>


            <span class="admin-category-id">

                ID:
                ${escapeCategoryHtml(
                    id || "-"
                )}

            </span>

        </div>


        <h3>
            ${escapeCategoryHtml(name)}
        </h3>


        <p>
            Used to classify events and help
            customers filter the event catalogue.
        </p>


        <div class="admin-category-card-actions">


            <button
                type="button"
                class="btn btn-primary"
                data-edit-category-id="${escapeCategoryHtml(
                    id
                )}"
            >
                Edit
            </button>


            <button
                type="button"
                class="btn btn-danger"
                data-delete-category-id="${escapeCategoryHtml(
                    id
                )}"
                data-category-name="${escapeCategoryHtml(
                    name
                )}"
            >
                Delete
            </button>


        </div>
    `;


    initializeCategoryCardActions(
        card
    );


    return card;
}


/* =========================================================
   CARD ACTIONS
   ========================================================= */

function initializeCategoryCardActions(
    card
) {

    const editButton =
        card.querySelector(
            "[data-edit-category-id]"
        );


    const deleteButton =
        card.querySelector(
            "[data-delete-category-id]"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            function () {

                openEditCategoryModal(
                    this.dataset
                        .editCategoryId
                );
            }
        );
    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            async function () {

                await confirmCategoryDeletion(

                    this.dataset
                        .deleteCategoryId,

                    this.dataset
                        .categoryName,

                    this
                );
            }
        );
    }
}


/* =========================================================
   ADD CATEGORY
   ========================================================= */

function openAddCategoryModal() {

    clearCategoryValidation();


    document
        .getElementById(
            "categoryForm"
        )
        ?.reset();


    setCategoryInputValue(
        "categoryId",
        ""
    );


    setCategoryText(
        "categoryFormTitle",
        "Add Category"
    );


    setCategoryText(
        "saveCategoryButton",
        "Save Category"
    );


    document
        .getElementById(
            "categoryFormModal"
        )
        ?.classList.add(
            "active"
        );


    setTimeout(
        function () {

            document
                .getElementById(
                    "categoryName"
                )
                ?.focus();

        },
        50
    );
}


/* =========================================================
   EDIT CATEGORY
   ========================================================= */

function openEditCategoryModal(
    categoryId
) {

    /*
     * BRD does NOT define
     * GET /api/categories/{id}.
     *
     * Therefore edit uses the category
     * already returned by GET /categories.
     */

    const category =
        adminCategories.find(
            function (item) {

                return (
                    String(
                        getCategoryId(item)
                    ) ===
                    String(categoryId)
                );
            }
        );


    if (!category) {

        showCategoryMessage(
            "Unable to find the selected category.",
            "error"
        );


        return;
    }


    clearCategoryValidation();


    setCategoryInputValue(
        "categoryId",
        getCategoryId(
            category
        )
    );


    setCategoryInputValue(
        "categoryName",
        getCategoryName(
            category
        )
    );


    setCategoryText(
        "categoryFormTitle",
        "Edit Category"
    );


    setCategoryText(
        "saveCategoryButton",
        "Update Category"
    );


    document
        .getElementById(
            "categoryFormModal"
        )
        ?.classList.add(
            "active"
        );
}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeCategoryModal() {

    if (categorySaveInProgress) {

        return;
    }


    closeCategoryModalForce();
}


function closeCategoryModalForce() {

    document
        .getElementById(
            "categoryFormModal"
        )
        ?.classList.remove(
            "active"
        );


    clearCategoryValidation();
}


/* =========================================================
   SAVE CATEGORY
   ========================================================= */

async function saveCategory(
    event
) {

    event.preventDefault();


    if (categorySaveInProgress) {

        return;
    }


    clearCategoryValidation();

    clearCategoryMessage();


    const categoryId =
        document
            .getElementById(
                "categoryId"
            )
            ?.value
            .trim() ||
        "";


    const categoryName =
        document
            .getElementById(
                "categoryName"
            )
            ?.value
            .trim() ||
        "";


    if (
        !validateCategoryForm(
            categoryName
        )
    ) {

        return;
    }


    /*
     * The BRD does not define additional
     * category fields, so only name is sent.
     */

    const requestData = {

        name:
            categoryName
    };


    const editing =
        Boolean(categoryId);


    setCategorySavingState(
        true,
        editing
    );


    try {

        if (editing) {

            /*
             * BRD:
             *
             * PUT /api/categories/{id}
             */

            await apiPut(
                `/categories/${encodeURIComponent(
                    categoryId
                )}`,
                requestData
            );


            closeCategoryModalForce();


            showCategoryMessage(
                "Category updated successfully.",
                "success"
            );


        } else {

            /*
             * BRD:
             *
             * POST /api/categories
             */

            await apiPost(
                "/categories",
                requestData
            );


            closeCategoryModalForce();


            showCategoryMessage(
                "Category created successfully.",
                "success"
            );
        }


        await loadAdminCategories();


    } catch (error) {

        console.error(
            "Save Category Error:",
            error
        );


        showCategoryMessage(
            getCategoryApiErrorMessage(
                error
            ),
            "error"
        );


    } finally {

        setCategorySavingState(
            false,
            editing
        );
    }
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateCategoryForm(
    categoryName
) {

    let valid =
        true;


    if (!categoryName) {

        showCategoryFieldError(
            "Category name is required."
        );


        valid =
            false;


    } else if (
        categoryName.length < 2
    ) {

        showCategoryFieldError(
            "Category name must contain at least 2 characters."
        );


        valid =
            false;


    } else if (
        categoryName.length > 100
    ) {

        showCategoryFieldError(
            "Category name cannot exceed 100 characters."
        );


        valid =
            false;
    }


    return valid;
}


/* =========================================================
   FIELD ERROR
   ========================================================= */

function showCategoryFieldError(
    message
) {

    document
        .getElementById(
            "categoryName"
        )
        ?.classList.add(
            "input-error"
        );


    const error =
        document.getElementById(
            "categoryNameError"
        );


    if (error) {

        error.textContent =
            message;
    }
}


/* =========================================================
   CLEAR VALIDATION
   ========================================================= */

function clearCategoryValidation() {

    document
        .getElementById(
            "categoryName"
        )
        ?.classList.remove(
            "input-error"
        );


    const error =
        document.getElementById(
            "categoryNameError"
        );


    if (error) {

        error.textContent =
            "";
    }
}


/* =========================================================
   SAVE BUTTON STATE
   ========================================================= */

function setCategorySavingState(
    saving,
    editing
) {

    categorySaveInProgress =
        saving;


    const button =
        document.getElementById(
            "saveCategoryButton"
        );


    if (!button) {

        return;
    }


    button.disabled =
        saving;


    if (saving) {

        button.textContent =
            editing
                ? "Updating..."
                : "Saving...";


    } else {

        button.textContent =
            editing
                ? "Update Category"
                : "Save Category";
    }
}


/* =========================================================
   DELETE CONFIRMATION
   ========================================================= */

async function confirmCategoryDeletion(
    categoryId,
    categoryName,
    button
) {

    if (
        categoryDeleteInProgress
    ) {

        return;
    }


    const confirmed =
        await openConfirmationModal({

            title:
                "Delete Category",

            message:
                `Delete ${categoryName}? This category cannot be deleted if it is currently assigned to an existing event.`,

            confirmText:
                "Delete Category",

            cancelText:
                "Keep Category"
        });


    if (!confirmed) {

        return;
    }


    await deleteCategory(
        categoryId,
        button
    );
}


/* =========================================================
   DELETE CATEGORY
   ========================================================= */

async function deleteCategory(
    categoryId,
    button
) {

    categoryDeleteInProgress =
        true;


    clearCategoryMessage();


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Deleting...";
    }


    try {

        /*
         * BRD:
         *
         * DELETE /api/categories/{id}
         *
         * Backend must reject deletion
         * when existing events reference
         * this category.
         */

        await apiDelete(
            `/categories/${encodeURIComponent(
                categoryId
            )}`
        );


        showCategoryMessage(
            "Category deleted successfully.",
            "success"
        );


        await loadAdminCategories();


    } catch (error) {

        console.error(
            "Delete Category Error:",
            error
        );


        if (
            error.status === 400 ||
            error.status === 409
        ) {

            showCategoryMessage(
                getCategoryApiErrorMessage(
                    error
                ) ||
                "This category cannot be deleted because it is assigned to one or more existing events.",
                "error"
            );


        } else {

            showCategoryMessage(
                getCategoryApiErrorMessage(
                    error
                ),
                "error"
            );
        }


        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Delete";
        }


    } finally {

        categoryDeleteInProgress =
            false;
    }
}


/* =========================================================
   API ERROR
   ========================================================= */

function getCategoryApiErrorMessage(
    error
) {

    if (
        error?.data?.errors
    ) {

        const messages =
            [];


        Object.values(
            error.data.errors
        )
            .forEach(
                function (items) {

                    if (
                        Array.isArray(items)
                    ) {

                        messages.push(
                            ...items
                        );
                    }
                }
            );


        if (
            messages.length > 0
        ) {

            return messages.join(
                " "
            );
        }
    }


    return (
        error?.message ||
        "Unable to complete the category operation."
    );
}


/* =========================================================
   HELPERS
   ========================================================= */

function getCategoryId(
    category
) {

    return (

        category?.categoryId ||

        category?.CategoryId ||

        category?.eventCategoryId ||

        category?.EventCategoryId ||

        category?.id ||

        category?.Id ||

        null
    );
}


function getCategoryName(
    category
) {

    return String(

        category?.name ||

        category?.Name ||

        category?.categoryName ||

        category?.CategoryName ||

        "Category"
    );
}


/* =========================================================
   INPUT VALUE
   ========================================================= */

function setCategoryInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value ?? "";
    }
}


/* =========================================================
   TEXT
   ========================================================= */

function setCategoryText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "";
    }
}


/* =========================================================
   LOADING
   ========================================================= */

function showCategoriesLoading() {

    document
        .getElementById(
            "categoriesLoading"
        )
        ?.classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "categoriesGrid"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "categoriesEmpty"
        )
        ?.classList.add(
            "hidden"
        );
}


function hideCategoriesLoading() {

    document
        .getElementById(
            "categoriesLoading"
        )
        ?.classList.add(
            "hidden"
        );
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showCategoryMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "adminCategoriesMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        message;


    element.className =
        type === "success"
            ? "alert alert-success"
            : "alert alert-error";
}


function clearCategoryMessage() {

    const element =
        document.getElementById(
            "adminCategoriesMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        "";


    element.className =
        "alert hidden";
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeCategoryHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}
