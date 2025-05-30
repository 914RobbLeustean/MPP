// Create a new migration file: AddPerformanceIndexes
using Microsoft.EntityFrameworkCore.Migrations;

namespace ThriftoServer.Migrations
{
    public partial class AddPerformanceIndexes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Optimize Listings table for filtering and sorting
            migrationBuilder.CreateIndex(
                name: "IX_Listings_Quality_Price",
                table: "Listings",
                columns: new[] { "Quality", "Price" });

            migrationBuilder.CreateIndex(
                name: "IX_Listings_IsActive_CreatedAt",
                table: "Listings",
                columns: new[] { "IsActive", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Listings_Title_Text_Search",
                table: "Listings",
                column: "Title")
                .Annotation("Npgsql:IndexMethod", "GIN")
                .Annotation("Npgsql:TsVectorConfig", "english");

            // Optimize Feedback for aggregate queries
            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_UserId_Rating",
                table: "Feedbacks",
                columns: new[] { "UserId", "Rating" });

            // Optimize Chat Messages for conversation retrieval
            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SenderId_ReceiverId_SentAt",
                table: "ChatMessages",
                columns: new[] { "SenderId", "ReceiverId", "SentAt" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Listings_Quality_Price",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_IsActive_CreatedAt",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_Title_Text_Search",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Feedbacks_UserId_Rating",
                table: "Feedbacks");

            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_SenderId_ReceiverId_SentAt",
                table: "ChatMessages");
        }
    }
}