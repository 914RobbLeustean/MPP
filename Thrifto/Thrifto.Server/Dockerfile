FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy only the backend project file
COPY ["Thrifto.Server/Thrifto.Server.csproj", "Thrifto.Server/"]

# Remove the frontend project reference from the copied file
RUN sed -i '/<ProjectReference.*thrifto\.client.*esproj/,/<\/ProjectReference>/d' "Thrifto.Server/Thrifto.Server.csproj"

# Restore packages
RUN dotnet restore "Thrifto.Server/Thrifto.Server.csproj"

# Copy the backend source code only
COPY ["Thrifto.Server/", "Thrifto.Server/"]

WORKDIR "/src/Thrifto.Server"
RUN dotnet build "Thrifto.Server.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Thrifto.Server.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Thrifto.Server.dll"]