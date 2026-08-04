# app/admin.py
from sqladmin import ModelView

from app.models.gift import Gift


class GiftAdmin(ModelView, model=Gift):  # type: ignore[call-arg]
    # Columns to display in list view
    column_list = [
        Gift.id,
        Gift.name,
        Gift.icon,
        Gift.coin_cost,
        Gift.diamond_cost,
        Gift.is_active,
        Gift.created_at,
        Gift.updated_at,
    ]

    # Searchable columns
    column_searchable_list = [Gift.name]

    # Sortable columns
    column_sortable_list = [
        Gift.name,
        Gift.coin_cost,
        Gift.diamond_cost,
        Gift.is_active,
        Gift.created_at,
        Gift.updated_at,
    ]

    # Fields to show in create/edit forms
    # Note: id, created_at, updated_at are auto-generated, so exclude them
    form_columns = [
        Gift.name,
        Gift.icon,
        Gift.coin_cost,
        Gift.diamond_cost,
        Gift.is_active,
    ]

    # Column labels
    column_labels = {
        Gift.id: "ID",
        Gift.name: "Gift Name",
        Gift.icon: "Icon URL",
        Gift.coin_cost: "Coin Cost",
        Gift.diamond_cost: "Diamond Cost",
        Gift.is_active: "Active",
        Gift.created_at: "Created At",
        Gift.updated_at: "Updated At",
    }

    # Format datetime columns
    column_formatters = {
        Gift.created_at: lambda m, a: (
            m.created_at.strftime("%Y-%m-%d %H:%M:%S") if m.created_at else ""
        ),
        Gift.updated_at: lambda m, a: (
            m.updated_at.strftime("%Y-%m-%d %H:%M:%S") if m.updated_at else ""
        ),
    }

    # Default sorting (newest first)
    column_default_sort = [(Gift.created_at, True)]

    # Items per page
    page_size = 20

    # Model name in admin panel
    name = "Gift"
    name_plural = "Gifts"
    icon = "fa-solid fa-gift"
