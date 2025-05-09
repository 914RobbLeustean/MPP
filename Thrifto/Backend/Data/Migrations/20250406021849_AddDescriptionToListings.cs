using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Thrifto.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddDescriptionToListings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Listings");
        }
    }
}
