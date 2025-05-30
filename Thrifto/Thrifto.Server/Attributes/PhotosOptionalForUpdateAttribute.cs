// Attributes/PhotosOptionalForUpdateAttribute.cs
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System;

namespace ThriftoServer.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class PhotosOptionalForUpdateAttribute : Attribute, IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            // Only apply this for PUT/PATCH requests (updates)
            if (context.HttpContext.Request.Method == "PUT" || context.HttpContext.Request.Method == "PATCH")
            {
                // Find Photos validation errors and remove them
                if (!context.ModelState.IsValid && context.ModelState.ContainsKey("Photos"))
                {
                    context.ModelState.Remove("Photos");

                    // Check if model state is now valid
                    foreach (var state in context.ModelState.Values)
                    {
                        if (state.ValidationState == ModelValidationState.Invalid)
                        {
                            return; // Still other validation errors
                        }
                    }

                    // If we get here, there are no more errors
                    context.ModelState.Clear();
                    context.ModelState.MarkFieldValid("Photos");
                }
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // No action needed after execution
        }
    }
}